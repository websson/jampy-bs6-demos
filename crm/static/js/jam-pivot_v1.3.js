/**
 * JamDataPivot v1.3 - Data Analysis & Drilldown Pivot Plugin
 * Designed for Jam.py Framework & Modern Responsive Web Applications.
 * Avoids .item class collision. Supports inline row expansion drilldown.
 */
class JamDataPivot {
  constructor(container, options = {}) {
    this.container = this._resolveContainer(container);
    if (!this.container) {
      console.error('JamDataPivot: Container element not found.');
      return;
    }

    this.options = Object.assign(
      {
        data: [],
        fields: [], // { name: 'field', label: 'Label', type: 'number', formatter: fn }
        groupBy: '', // Initial field to group by
        aggFunc: 'SUM', // SUM, AVG, COUNT, MIN, MAX, DISTINCT
        aggField: '', // Target aggregation field
        showMetricCards: true,
        enableSearch: true,
        enableExport: true,
        exportFormats: ['csv', 'xls'],
        theme: 'light', // 'light' or 'dark'
        autoExpandAll: false, // Whether groups start expanded
        onGroupChange: null,
        onCellClick: null,
        onDrilldownToggle: null
      },
      options
    );

    this.filteredData = [];
    this.pivotResults = [];
    this.expandedGroups = new Set();
    this.searchQuery = '';

    this._init();
  }

  _resolveContainer(c) {
    if (typeof c === 'string') return document.querySelector(c);
    if (c && c.jquery) return c[0];
    if (c && c.nodeType) return c;
    return null;
  }

  _init() {
    this.container.classList.add('jdp-root');
    if (this.options.theme === 'dark') {
      this.container.classList.add('jdp-dark');
    }

    // Auto-detect fields if not explicitly provided
    if ((!this.options.fields || this.options.fields.length === 0) && this.options.data.length > 0) {
      this.options.fields = Object.keys(this.options.data[0]).map(key => ({
        name: key,
        label: this._formatHeaderLabel(key),
        type: typeof this.options.data[0][key] === 'number' ? 'number' : 'string'
      }));
    }

    if (!this.options.aggField) {
      const numField = this.options.fields.find(f => f.type === 'number');
      this.options.aggField = numField ? numField.name : (this.options.fields[0]?.name || '');
    }

    if (!this.options.groupBy && this.options.fields.length > 0) {
      const strField = this.options.fields.find(f => f.type !== 'number');
      this.options.groupBy = strField ? strField.name : this.options.fields[0].name;
    }

    this.renderLayout();
    this.loadData(this.options.data);
  }

  _formatHeaderLabel(str) {
    return str
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  renderLayout() {
    const showCSV = this.options.exportFormats.includes('csv');
    const showXLS = this.options.exportFormats.includes('xls') || this.options.exportFormats.includes('xlsx');

    this.container.innerHTML = `
      <div class="jdp-wrapper">
        <div class="jdp-toolbar">
          <div class="jdp-control-group">
            <label class="jdp-label">Group By</label>
            <select class="jdp-select jdp-group-select"></select>
          </div>
          
          <div class="jdp-control-group">
            <label class="jdp-label">Function</label>
            <select class="jdp-select jdp-func-select">
              <option value="SUM">SUM</option>
              <option value="AVG">AVERAGE</option>
              <option value="COUNT">COUNT</option>
              <option value="MIN">MIN</option>
              <option value="MAX">MAX</option>
              <option value="DISTINCT">COUNT DISTINCT</option>
            </select>
          </div>

          <div class="jdp-control-group">
            <label class="jdp-label">Target Field</label>
            <select class="jdp-select jdp-target-select"></select>
          </div>

          ${
            this.options.enableSearch
              ? `
            <div class="jdp-control-group jdp-search-group">
              <label class="jdp-label">Search Filter</label>
              <input type="text" class="jdp-input jdp-search-input" placeholder="Filter rows..." />
            </div>
          `
              : ''
          }

          <div class="jdp-control-group">
            <label class="jdp-label">View Detail</label>
            <div class="jdp-export-btn-group">
              <button type="button" class="jdp-btn jdp-btn-expand-all" title="Expand All Groups">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                Expand All
              </button>
              <button type="button" class="jdp-btn jdp-btn-collapse-all" title="Collapse All Groups">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                Collapse
              </button>
            </div>
          </div>

          ${
            this.options.enableExport
              ? `
            <div class="jdp-control-group jdp-actions-group">
              <label class="jdp-label">Export Data</label>
              <div class="jdp-export-btn-group">
                ${
                  showCSV
                    ? `
                  <button type="button" class="jdp-btn jdp-btn-csv" title="Export to CSV">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    CSV
                  </button>
                `
                    : ''
                }
                ${
                  showXLS
                    ? `
                  <button type="button" class="jdp-btn jdp-btn-xlsx" title="Export to Excel (.xls)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Excel
                  </button>
                `
                    : ''
                }
              </div>
            </div>
          `
              : ''
          }
        </div>

        ${this.options.showMetricCards ? `<div class="jdp-metrics-grid"></div>` : ''}

        <div class="jdp-table-container">
          <table class="jdp-table">
            <thead></thead>
            <tbody></tbody>
            <tfoot></tfoot>
          </table>
        </div>
      </div>
    `;

    this._bindEvents();
    this._populateSelects();
  }

  _populateSelects() {
    const groupSelect = this.container.querySelector('.jdp-group-select');
    const targetSelect = this.container.querySelector('.jdp-target-select');
    const funcSelect = this.container.querySelector('.jdp-func-select');

    groupSelect.innerHTML = '';
    targetSelect.innerHTML = '';

    this.options.fields.forEach(field => {
      const gOpt = document.createElement('option');
      gOpt.value = field.name;
      gOpt.textContent = field.label || field.name;
      if (field.name === this.options.groupBy) gOpt.selected = true;
      groupSelect.appendChild(gOpt);

      const tOpt = document.createElement('option');
      tOpt.value = field.name;
      tOpt.textContent = field.label || field.name;
      if (field.name === this.options.aggField) tOpt.selected = true;
      targetSelect.appendChild(tOpt);
    });

    funcSelect.value = this.options.aggFunc;
  }

  _bindEvents() {
    const groupSelect = this.container.querySelector('.jdp-group-select');
    const funcSelect = this.container.querySelector('.jdp-func-select');
    const targetSelect = this.container.querySelector('.jdp-target-select');
    const searchInput = this.container.querySelector('.jdp-search-input');
    const expandAllBtn = this.container.querySelector('.jdp-btn-expand-all');
    const collapseAllBtn = this.container.querySelector('.jdp-btn-collapse-all');
    const csvBtn = this.container.querySelector('.jdp-btn-csv');
    const xlsxBtn = this.container.querySelector('.jdp-btn-xlsx');

    groupSelect.addEventListener('change', e => {
      this.options.groupBy = e.target.value;
      this.expandedGroups.clear();
      this.calculateAndRender();
      if (typeof this.options.onGroupChange === 'function') {
        this.options.onGroupChange(this.options.groupBy, this.options.aggFunc, this.options.aggField);
      }
    });

    funcSelect.addEventListener('change', e => {
      this.options.aggFunc = e.target.value;
      this.calculateAndRender();
    });

    targetSelect.addEventListener('change', e => {
      this.options.aggField = e.target.value;
      this.calculateAndRender();
    });

    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.calculateAndRender();
      });
    }

    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => this.expandAll());
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => this.collapseAll());
    }

    if (csvBtn) csvBtn.addEventListener('click', () => this.exportToCSV());
    if (xlsxBtn) xlsxBtn.addEventListener('click', () => this.exportToXLS());
  }

  loadData(newData) {
    this.options.data = Array.isArray(newData) ? newData : [];
    if (this.options.autoExpandAll) {
      this.expandAll();
    } else {
      this.calculateAndRender();
    }
  }

  calculateAndRender() {
    // 1. Filter Dataset
    if (this.searchQuery) {
      this.filteredData = this.options.data.filter(row => {
        return Object.values(row).some(val =>
          String(val !== null && val !== undefined ? val : '')
            .toLowerCase()
            .includes(this.searchQuery)
        );
      });
    } else {
      this.filteredData = [...this.options.data];
    }

    // 2. Aggregate Data into Parent Groupings
    const groups = {};
    const groupKey = this.options.groupBy;
    const targetKey = this.options.aggField;

    this.filteredData.forEach(row => {
      const rawGroupVal = row[groupKey];
      const gValue = rawGroupVal !== undefined && rawGroupVal !== null && rawGroupVal !== '' ? String(rawGroupVal) : '(Blank)';
      const val = parseFloat(row[targetKey]);

      if (!groups[gValue]) {
        groups[gValue] = {
          groupName: gValue,
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          distinctValues: new Set(),
          rawRows: []
        };
      }

      const g = groups[gValue];
      g.count++;
      g.rawRows.push(row);

      const rawVal = row[targetKey];
      if (rawVal !== undefined && rawVal !== null) {
        g.distinctValues.add(rawVal);
      }

      if (!isNaN(val)) {
        g.sum += val;
        if (val < g.min) g.min = val;
        if (val > g.max) g.max = val;
      }
    });

    this.pivotResults = Object.keys(groups).map(key => {
      const g = groups[key];
      let aggregatedValue = 0;

      switch (this.options.aggFunc) {
        case 'SUM':
          aggregatedValue = g.sum;
          break;
        case 'AVG':
          aggregatedValue = g.count > 0 ? g.sum / g.count : 0;
          break;
        case 'COUNT':
          aggregatedValue = g.count;
          break;
        case 'MIN':
          aggregatedValue = g.min === Infinity ? 0 : g.min;
          break;
        case 'MAX':
          aggregatedValue = g.max === -Infinity ? 0 : g.max;
          break;
        case 'DISTINCT':
          aggregatedValue = g.distinctValues.size;
          break;
      }

      return {
        groupValue: g.groupName,
        count: g.count,
        value: aggregatedValue,
        rawRows: g.rawRows
      };
    });

    this.pivotResults.sort((a, b) => b.value - a.value);

    if (this.options.showMetricCards) {
      this.renderMetricCards();
    }
    this.renderTable();
  }

  renderMetricCards() {
    const grid = this.container.querySelector('.jdp-metrics-grid');
    if (!grid) return;

    const totalRecords = this.filteredData.length;
    const totalGroups = this.pivotResults.length;
    const totalAgg = this.pivotResults.reduce((acc, curr) => acc + (this.options.aggFunc === 'AVG' ? curr.value * curr.count : curr.value), 0);
    const overallAgg = this.options.aggFunc === 'AVG' ? (totalRecords > 0 ? totalAgg / totalRecords : 0) : totalAgg;

    const targetFieldObj = this.options.fields.find(f => f.name === this.options.aggField);
    const formattedOverall = this.formatValue(overallAgg, targetFieldObj);

    grid.innerHTML = `
      <div class="jdp-card">
        <div class="jdp-card-title">Total Records</div>
        <div class="jdp-card-value">${totalRecords.toLocaleString()}</div>
      </div>
      <div class="jdp-card">
        <div class="jdp-card-title">Unique Groups</div>
        <div class="jdp-card-value">${totalGroups.toLocaleString()}</div>
      </div>
      <div class="jdp-card jdp-card-highlight">
        <div class="jdp-card-title">Overall ${this.options.aggFunc} (${targetFieldObj ? targetFieldObj.label : this.options.aggField})</div>
        <div class="jdp-card-value">${formattedOverall}</div>
      </div>
    `;
  }

  renderTable() {
    const table = this.container.querySelector('.jdp-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    const tfoot = table.querySelector('tfoot');

    const groupFieldObj = this.options.fields.find(f => f.name === this.options.groupBy);
    const targetFieldObj = this.options.fields.find(f => f.name === this.options.aggField);

    const groupLabel = groupFieldObj ? groupFieldObj.label : this.options.groupBy;
    const targetLabel = targetFieldObj ? targetFieldObj.label : this.options.aggField;

    thead.innerHTML = `
      <tr>
        <th class="jdp-th-left" style="width: 35%;">${groupLabel}</th>
        <th class="jdp-th-right" style="width: 20%;">Record Count</th>
        <th class="jdp-th-right" style="width: 25%;">${this.options.aggFunc} of ${targetLabel}</th>
        <th class="jdp-th-right" style="width: 20%;">Share (%)</th>
      </tr>
    `;

    const grandTotal = this.pivotResults.reduce((acc, curr) => acc + curr.value, 0);

    if (this.pivotResults.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="jdp-empty-msg">No matching data records found</td>
        </tr>
      `;
      tfoot.innerHTML = '';
      return;
    }

    let bodyHtml = '';
    this.pivotResults.forEach(res => {
      const isExpanded = this.expandedGroups.has(res.groupValue);
      const share = grandTotal !== 0 ? ((res.value / grandTotal) * 100).toFixed(1) : '0.0';
      const formattedVal = this.formatValue(res.value, targetFieldObj);

      // Parent Group Row
      bodyHtml += `
        <tr class="jdp-parent-row ${isExpanded ? 'jdp-expanded' : ''}" data-group="${this.escapeHtml(res.groupValue)}">
          <td class="jdp-td-left jdp-cell-group">
            <div class="jdp-group-flex">
              <button type="button" class="jdp-toggle-btn" title="Click to drilldown">
                <svg class="jdp-chevron ${isExpanded ? 'jdp-rotate' : ''}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <span class="jdp-group-badge">${this.escapeHtml(res.groupValue)}</span>
            </div>
          </td>
          <td class="jdp-td-right">${res.count.toLocaleString()}</td>
          <td class="jdp-td-right jdp-val-bold">${formattedVal}</td>
          <td class="jdp-td-right">
            <div class="jdp-share-bar-container">
              <div class="jdp-share-bar" style="width: ${Math.min(100, Math.max(0, share))}%;"></div>
              <span class="jdp-share-text">${share}%</span>
            </div>
          </td>
        </tr>
      `;

      // Child Drilldown Details Table Row
      if (isExpanded) {
        bodyHtml += this._renderDrilldownChildRow(res);
      }
    });

    tbody.innerHTML = bodyHtml;

    // Footer Summary Row
    const formattedGrandTotal = this.formatValue(grandTotal, targetFieldObj);
    tfoot.innerHTML = `
      <tr>
        <td class="jdp-td-left">Total (${this.pivotResults.length} Groups)</td>
        <td class="jdp-td-right">${this.filteredData.length.toLocaleString()}</td>
        <td class="jdp-td-right jdp-val-bold">${formattedGrandTotal}</td>
        <td class="jdp-td-right">100.0%</td>
      </tr>
    `;

    this._bindTableEvents(tbody);
  }

  _renderDrilldownChildRow(groupResult) {
    const visibleFields = this.options.fields;

    let drillHeaders = visibleFields.map(f => `<th class="${f.type === 'number' ? 'jdp-th-right' : 'jdp-th-left'}">${f.label || f.name}</th>`).join('');

    let drillRows = groupResult.rawRows
      .map(row => {
        let cells = visibleFields
          .map(f => {
            const rawVal = row[f.name];
            const isNum = f.type === 'number';
            const valStr = isNum && typeof rawVal === 'number' ? this.formatValue(rawVal, f) : this.escapeHtml(rawVal !== undefined && rawVal !== null ? rawVal : '');
            return `<td class="${isNum ? 'jdp-td-right' : 'jdp-td-left'}">${valStr}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `
      <tr class="jdp-drilldown-row" data-parent-group="${this.escapeHtml(groupResult.groupValue)}">
        <td colspan="4" class="jdp-drilldown-cell">
          <div class="jdp-drilldown-container">
            <div class="jdp-drilldown-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              <span>Detail Data Records: <strong>${this.escapeHtml(groupResult.groupValue)}</strong> (${groupResult.count} records)</span>
            </div>
            <div class="jdp-nested-table-wrapper">
              <table class="jdp-nested-table">
                <thead><tr>${drillHeaders}</tr></thead>
                <tbody>${drillRows}</tbody>
              </table>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  _bindTableEvents(tbody) {
    tbody.querySelectorAll('.jdp-parent-row').forEach(parentRow => {
      parentRow.addEventListener('click', e => {
        const groupName = parentRow.getAttribute('data-group');

        // Toggle Drilldown Expansion
        if (this.expandedGroups.has(groupName)) {
          this.expandedGroups.delete(groupName);
        } else {
          this.expandedGroups.add(groupName);
        }

        this.renderTable();

        if (typeof this.options.onDrilldownToggle === 'function') {
          this.options.onDrilldownToggle(groupName, this.expandedGroups.has(groupName));
        }

        if (typeof this.options.onCellClick === 'function') {
          const matchedResult = this.pivotResults.find(r => r.groupValue === groupName);
          this.options.onCellClick(matchedResult, this.options);
        }
      });
    });
  }

  formatValue(val, fieldObj) {
    if (fieldObj && typeof fieldObj.formatter === 'function') {
      return fieldObj.formatter(val);
    }
    if (this.options.aggFunc === 'COUNT' || this.options.aggFunc === 'DISTINCT') {
      return Math.round(val).toLocaleString();
    }
    return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Expand / Collapse Public Methods ---
  expandAll() {
    this.pivotResults.forEach(r => this.expandedGroups.add(r.groupValue));
    this.renderTable();
  }

  collapseAll() {
    this.expandedGroups.clear();
    this.renderTable();
  }

  // --- Export Methods ---
  exportToCSV() {
    if (!this.pivotResults.length) return;
    const groupFieldObj = this.options.fields.find(f => f.name === this.options.groupBy);
    const targetFieldObj = this.options.fields.find(f => f.name === this.options.aggField);

    let csv = [
      `"${groupFieldObj ? groupFieldObj.label : this.options.groupBy}","Record Count","${this.options.aggFunc} of ${targetFieldObj ? targetFieldObj.label : this.options.aggField}","Share (%)"`
    ];

    const grandTotal = this.pivotResults.reduce((acc, curr) => acc + curr.value, 0);

    this.pivotResults.forEach(r => {
      const share = grandTotal !== 0 ? ((r.value / grandTotal) * 100).toFixed(1) : '0.0';
      csv.push(`"${r.groupValue.replace(/"/g, '""')}",${r.count},${r.value},${share}`);
    });

    const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    this._triggerDownload(blob, `Pivot_Analysis_${this.options.groupBy}_${Date.now()}.csv`);
  }

  exportToXLS() {
    if (!this.pivotResults.length) return;
    const groupFieldObj = this.options.fields.find(f => f.name === this.options.groupBy);
    const targetFieldObj = this.options.fields.find(f => f.name === this.options.aggField);
    const groupLabel = groupFieldObj ? groupFieldObj.label : this.options.groupBy;
    const targetLabel = targetFieldObj ? targetFieldObj.label : this.options.aggField;

    const grandTotal = this.pivotResults.reduce((acc, curr) => acc + curr.value, 0);

    let excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          th { background-color: #3B82F6; color: #FFFFFF; font-weight: bold; text-align: center; }
          td { mso-number-format:"\\@"; }
          .num { mso-number-format:"#,##0.00"; text-align: right; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>${this.escapeHtml(groupLabel)}</th>
              <th>Record Count</th>
              <th>${this.escapeHtml(this.options.aggFunc + ' of ' + targetLabel)}</th>
              <th>Share (%)</th>
            </tr>
          </thead>
          <tbody>`;

    this.pivotResults.forEach(r => {
      const share = grandTotal !== 0 ? ((r.value / grandTotal) * 100).toFixed(1) : '0.0';
      excelHtml += `
            <tr>
              <td>${this.escapeHtml(r.groupValue)}</td>
              <td class="num">${r.count}</td>
              <td class="num">${r.value}</td>
              <td class="num">${share}%</td>
            </tr>`;
    });

    excelHtml += `
            <tr>
              <td class="bold">Total (${this.pivotResults.length} Groups)</td>
              <td class="num bold">${this.filteredData.length}</td>
              <td class="num bold">${grandTotal}</td>
              <td class="num bold">100.0%</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel' });
    this._triggerDownload(blob, `Pivot_Analysis_${this.options.groupBy}_${Date.now()}.xls`);
  }

  exportToXLSX() {
    this.exportToXLS();
  }

  _triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Public Configuration APIs ---
  setGrouping(fieldName) {
    this.options.groupBy = fieldName;
    this.expandedGroups.clear();
    const groupSelect = this.container.querySelector('.jdp-group-select');
    if (groupSelect) groupSelect.value = fieldName;
    this.calculateAndRender();
  }

  setAggregation(func, fieldName) {
    this.options.aggFunc = func;
    if (fieldName) this.options.aggField = fieldName;
    
    const funcSelect = this.container.querySelector('.jdp-func-select');
    const targetSelect = this.container.querySelector('.jdp-target-select');
    if (funcSelect) funcSelect.value = func;
    if (targetSelect && fieldName) targetSelect.value = fieldName;

    this.calculateAndRender();
  }

  getResults() {
    return this.pivotResults;
  }

  destroy() {
    this.container.innerHTML = '';
    this.container.classList.remove('jdp-root', 'jdp-dark');
  }
}

// jQuery extension registration
if (typeof window !== 'undefined' && window.jQuery) {
  window.jQuery.fn.jamDataPivot = function (options) {
    return this.each(function () {
      if (!window.jQuery.data(this, 'jamDataPivot')) {
        window.jQuery.data(this, 'jamDataPivot', new JamDataPivot(this, options));
      }
    });
  };
}