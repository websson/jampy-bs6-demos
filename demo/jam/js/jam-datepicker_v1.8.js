/**
 * jam-datepicker v1.8.1
 * Modern Bootstrap 5/6 & Jam.py Compatible Date & Time Picker
 */
(function (global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory(global);
    } else {
        factory(global);
    }
}(typeof window !== "undefined" ? window : this, function (window) {
    'use strict';

    const DEFAULT_I18N = {
        today: 'Today',
        clear: 'Clear',
        close: 'OK',
        monthsLong: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    };

    const DEFAULT_OPTIONS = {
        format: 'YYYY-MM-DD HH:mm', // Supports 'm/d/Y', 'MM/DD/YYYY HH:mm', etc.
        viewMode: 'days',
        sideBySide: false,
        inline: false,
        use24Hour: true,
        closeOnSelect: false,
        readonlyInput: false,
		openOnInputClick: true,
        firstDayOfWeek: 0,       // 0 = Sunday, 1 = Monday
        position: 'auto',        // 'auto', 'top', 'below', 'above'
        container: null,         // Custom container element or jQuery node
        showToday: true,
        showClear: true,
        showClose: true,
        theme: 'light',          // 'light' or 'dark'
        zIndex: 1070,
        i18n: DEFAULT_I18N,
        minDate: null,
        maxDate: null,
        disabledDates: [],
        onChange: null,
        onShow: null,
        onHide: null
    };

    class JamDatePicker {
        constructor(element, options = {}) {
            this.element = typeof element === 'string' ? document.querySelector(element) : element;
            if (this.element && this.element.jquery) this.element = this.element[0];

            const mergedI18n = Object.assign({}, DEFAULT_I18N, options.i18n || {});
            this.options = Object.assign({}, DEFAULT_OPTIONS, options);
            this.options.i18n = mergedI18n;

            this.currentDate = new Date();
            this.viewDate = new Date(this.currentDate);
            this.selectedDate = null;
            
            this.activeView = 'days';
            this.yearGroupStart = Math.floor(this.viewDate.getFullYear() / 12) * 12;

            this.selectedHour = this.currentDate.getHours();
            this.selectedMinute = Math.floor(this.currentDate.getMinutes() / 5) * 5;
            this.timeMode = 'hours';
            this.period = this.selectedHour >= 12 ? 'PM' : 'AM';

            this.isOpen = false;
            this.init();
        }

        init() {
            this.parseInitialValue();
            this.configureInputBehavior();
            this.buildWidget();
            this.bindEvents();

            if (this.options.inline) {
                this.show();
            }
        }

        configureInputBehavior() {
            if (this.options.readonlyInput && this.element) {
                this.element.setAttribute('readonly', 'readonly');
                this.element.style.cursor = 'pointer';
            }
        }

        /**
         * Checks if the format string contains time components
         */
        hasTimeComponent() {
            const fmt = this.options.format;
            // Explicitly check for Hour tokens (H, h) or Minute tokens (mm, M) or colon separators
            return /[Hh]/.test(fmt) || /mm/.test(fmt) || /:\s*M/.test(fmt) || /\s+H/i.test(fmt);
        }

        parseInitialValue() {
            if (!this.element) return;
            const val = (this.element.value || '').trim();
            if (!val) return;

            let parsed = new Date(val);

            if (isNaN(parsed.getTime())) {
                const parts = val.split(/[\s\/\-\:]+/);
                if (parts.length >= 3) {
                    let m = parseInt(parts[0], 10) - 1;
                    let d = parseInt(parts[1], 10);
                    let y = parseInt(parts[2], 10);
                    let h = parts[3] ? parseInt(parts[3], 10) : 0;
                    let min = parts[4] ? parseInt(parts[4], 10) : 0;
                    parsed = new Date(y, m, d, h, min);
                }
            }

            if (!isNaN(parsed.getTime())) {
                this.selectedDate = parsed;
                this.viewDate = new Date(parsed);
                this.selectedHour = parsed.getHours();
                this.selectedMinute = parsed.getMinutes();
                this.period = this.selectedHour >= 12 ? 'PM' : 'AM';
            }
        }

        _getContainerNode() {
            if (this.options.container) {
                if (typeof this.options.container === 'string') {
                    return document.querySelector(this.options.container);
                }
                if (this.options.container.jquery) {
                    return this.options.container[0];
                }
                if (this.options.container.nodeType) {
                    return this.options.container;
                }
            }
            const dialogParent = this.element ? this.element.closest('dialog, .modal-content, .modal') : null;
            return dialogParent || document.body;
        }

        buildWidget() {
            this.widget = document.createElement('div');
            this.widget.className = `jdp-widget jdp-theme-${this.options.theme}`;
            if (this.options.inline) this.widget.classList.add('jdp-inline');
            if (this.options.sideBySide) this.widget.classList.add('jdp-side-by-side');

            if (!this.options.inline && this.options.zIndex) {
                this.widget.style.zIndex = this.options.zIndex;
                this.widget.style.setProperty('--jdp-z-index', this.options.zIndex);
            }

            this.render();

            if (!this.options.inline) {
                const targetContainer = this._getContainerNode();
                targetContainer.appendChild(this.widget);
            } else {
                this.element.parentNode.insertBefore(this.widget, this.element.nextSibling);
            }
        }

        render() {
            let bodyHtml = '';
            const hasTime = this.hasTimeComponent();

            if (this.options.sideBySide && hasTime) {
                bodyHtml = `
                    <div class="row g-2 w-100 h-100">
                        <div class="col-6 jdp-date-section">${this.renderCalendarHtml()}</div>
                        <div class="col-6 jdp-time-section">${this.renderClockHtml()}</div>
                    </div>
                `;
            } else {
                switch (this.activeView) {
                    case 'months':
                        bodyHtml = `<div class="jdp-date-section w-100">${this.renderMonthsGridHtml()}</div>`;
                        break;
                    case 'years':
                        bodyHtml = `<div class="jdp-date-section w-100">${this.renderYearsGridHtml()}</div>`;
                        break;
                    case 'time':
                        bodyHtml = `<div class="jdp-time-section w-100">${this.renderClockHtml()}</div>`;
                        break;
                    case 'days':
                    default:
                        bodyHtml = `<div class="jdp-date-section w-100">${this.renderCalendarHtml()}</div>`;
                        break;
                }
            }

            this.widget.innerHTML = `
                <div class="jdp-view-container">${bodyHtml}</div>
                ${this.renderFooterHtml()}
            `;

            this.attachWidgetListeners();
        }

        renderCalendarHtml() {
            const i18n = this.options.i18n;
            const year = this.viewDate.getFullYear();
            const month = this.viewDate.getMonth();
            const firstDayOfWeek = this.options.firstDayOfWeek % 7;

            let header = `
                <div class="jdp-header">
                    <button type="button" class="jdp-nav-btn jdp-prev-btn">&lt;</button>
                    <div>
                        <span class="jdp-header-title jdp-title-month">${i18n.monthsLong[month]}</span>
                        <span class="jdp-header-title jdp-title-year">${year}</span>
                    </div>
                    <button type="button" class="jdp-nav-btn jdp-next-btn">&gt;</button>
                </div>
            `;

            let shiftedDays = [];
            for (let i = 0; i < 7; i++) {
                shiftedDays.push(i18n.daysMin[(i + firstDayOfWeek) % 7]);
            }
            let daysHeader = shiftedDays.map(d => `<div class="jdp-day-header">${d}</div>`).join('');

            const firstDayIndex = (new Date(year, month, 1).getDay() - firstDayOfWeek + 7) % 7;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const prevMonthDays = new Date(year, month, 0).getDate();

            let cellsHtml = '';

            for (let x = firstDayIndex; x > 0; x--) {
                cellsHtml += `<div class="jdp-cell jdp-other-month">${prevMonthDays - x + 1}</div>`;
            }

            const today = new Date();
            for (let i = 1; i <= daysInMonth; i++) {
                let isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year ? 'jdp-today' : '';
                let isSelected = this.selectedDate && this.selectedDate.getDate() === i && this.selectedDate.getMonth() === month && this.selectedDate.getFullYear() === year ? 'jdp-selected' : '';

                cellsHtml += `<div class="jdp-cell ${isToday} ${isSelected}" data-day="${i}">${i}</div>`;
            }

            return `${header}<div class="jdp-calendar-grid">${daysHeader}${cellsHtml}</div>`;
        }

        renderMonthsGridHtml() {
            const i18n = this.options.i18n;
            const year = this.viewDate.getFullYear();

            let header = `
                <div class="jdp-header">
                    <button type="button" class="jdp-nav-btn jdp-prev-btn">&lt;</button>
                    <span class="jdp-header-title jdp-title-year">${year}</span>
                    <button type="button" class="jdp-nav-btn jdp-next-btn">&gt;</button>
                </div>
            `;

            let monthsHtml = i18n.monthsShort.map((m, idx) => {
                let isSelected = this.viewDate.getMonth() === idx ? 'active' : '';
                return `<div class="jdp-grid-item ${isSelected}" data-month="${idx}">${m}</div>`;
            }).join('');

            return `${header}<div class="jdp-months-grid">${monthsHtml}</div>`;
        }

        renderYearsGridHtml() {
            const startYear = this.yearGroupStart;
            const endYear = startYear + 11;

            let header = `
                <div class="jdp-header">
                    <button type="button" class="jdp-nav-btn jdp-prev-btn">&lt;</button>
                    <span class="jdp-header-title">${startYear} - ${endYear}</span>
                    <button type="button" class="jdp-nav-btn jdp-next-btn">&gt;</button>
                </div>
            `;

            let yearsHtml = '';
            for (let y = startYear; y <= endYear; y++) {
                let isSelected = this.viewDate.getFullYear() === y ? 'active' : '';
                yearsHtml += `<div class="jdp-grid-item ${isSelected}" data-year="${y}">${y}</div>`;
            }

            return `${header}<div class="jdp-years-grid">${yearsHtml}</div>`;
        }

        renderClockHtml() {
            let displayHour = this.selectedHour;
            if (!this.options.use24Hour) {
                displayHour = displayHour % 12 || 12;
            }

            const formattedHour = String(displayHour).padStart(2, '0');
            const formattedMinute = String(this.selectedMinute).padStart(2, '0');

            return `
                <div class="jdp-timepicker-container">
                    <div class="jdp-time-display">
                        <div class="jdp-time-box ${this.timeMode === 'hours' ? 'active' : ''}" data-target="hours">${formattedHour}</div>
                        <div class="jdp-time-colon">:</div>
                        <div class="jdp-time-box ${this.timeMode === 'minutes' ? 'active' : ''}" data-target="minutes">${formattedMinute}</div>
                        ${!this.options.use24Hour ? `
                            <div class="jdp-period-toggle">
                                <button type="button" class="jdp-period-btn ${this.period === 'AM' ? 'active' : ''}" data-period="AM">AM</button>
                                <button type="button" class="jdp-period-btn ${this.period === 'PM' ? 'active' : ''}" data-period="PM">PM</button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="jdp-clock-face">
                        <div class="jdp-clock-center"></div>
                        <div class="jdp-clock-hand" id="jdp-hand"></div>
                        ${this.renderClockNumbers()}
                    </div>
                </div>
            `;
        }

        renderClockNumbers() {
            let html = '';
            const isHours = this.timeMode === 'hours';

            if (isHours && this.options.use24Hour) {
                for (let i = 1; i <= 12; i++) {
                    let angle = (i * 30) * (Math.PI / 180);
                    let x = Math.round(85 + 75 * Math.sin(angle));
                    let y = Math.round(85 - 75 * Math.cos(angle));
                    let isActive = (this.selectedHour % 12 || 12) === i && this.selectedHour <= 12 && this.selectedHour !== 0;

                    html += `<div class="jdp-clock-number ${isActive ? 'active' : ''}" style="left:${x}px; top:${y}px;" data-val="${i}">${i}</div>`;
                }
                for (let i = 1; i <= 12; i++) {
                    let val = i === 12 ? 0 : i + 12;
                    let angle = (i * 30) * (Math.PI / 180);
                    let x = Math.round(85 + 48 * Math.sin(angle));
                    let y = Math.round(85 - 48 * Math.cos(angle));
                    let isActive = this.selectedHour === val;
                    let label = String(val).padStart(2, '0');

                    html += `<div class="jdp-clock-number jdp-inner-ring ${isActive ? 'active' : ''}" style="left:${x}px; top:${y}px;" data-val="${val}">${label}</div>`;
                }
            } else {
                const count = 12;
                const radius = 75;

                for (let i = 1; i <= count; i++) {
                    let val = isHours ? i : (i * 5) % 60;
                    let angle = (i * 30) * (Math.PI / 180);
                    let x = Math.round(85 + radius * Math.sin(angle));
                    let y = Math.round(85 - radius * Math.cos(angle));

                    let isActive = isHours ? 
                        ((this.selectedHour % 12 || 12) === val) : 
                        this.selectedMinute === val;

                    let label = isHours ? val : String(val).padStart(2, '0');

                    html += `<div class="jdp-clock-number ${isActive ? 'active' : ''}" style="left:${x}px; top:${y}px;" data-val="${val}">${label}</div>`;
                }
            }
            return html;
        }

        renderFooterHtml() {
            const i18n = this.options.i18n;
            const hasTime = this.hasTimeComponent();
            const iconClass = this.activeView === 'time' ? 'bi bi-calendar3' : 'bi bi-clock';

            return `
                <div class="jdp-footer">
                    <div>
                        ${this.options.showToday ? `<button type="button" class="btn btn-sm btn-outline-primary jdp-btn-today">${i18n.today}</button>` : ''}
                        ${this.options.showClear ? `<button type="button" class="btn btn-sm btn-outline-secondary jdp-btn-clear ms-1">${i18n.clear}</button>` : ''}
                    </div>
                    <div>
                        ${hasTime && !this.options.sideBySide ? `<button type="button" class="btn btn-sm btn-outline-secondary jdp-btn-toggle-view ms-1"><i class="${iconClass}"></i></button>` : ''}
                        ${this.options.showClose ? `<button type="button" class="btn btn-sm btn-primary jdp-btn-close ms-1">${i18n.close}</button>` : ''}
                    </div>
                </div>
            `;
        }

        attachWidgetListeners() {
            const prevBtn = this.widget.querySelector('.jdp-prev-btn');
            const nextBtn = this.widget.querySelector('.jdp-next-btn');
            const monthTitle = this.widget.querySelector('.jdp-title-month');
            const yearTitle = this.widget.querySelector('.jdp-title-year');

            if (prevBtn) {
                prevBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (this.activeView === 'days') this.viewDate.setMonth(this.viewDate.getMonth() - 1);
                    else if (this.activeView === 'months') this.viewDate.setFullYear(this.viewDate.getFullYear() - 1);
                    else if (this.activeView === 'years') this.yearGroupStart -= 12;
                    this.render();
                };
            }

            if (nextBtn) {
                nextBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (this.activeView === 'days') this.viewDate.setMonth(this.viewDate.getMonth() + 1);
                    else if (this.activeView === 'months') this.viewDate.setFullYear(this.viewDate.getFullYear() + 1);
                    else if (this.activeView === 'years') this.yearGroupStart += 12;
                    this.render();
                };
            }

            if (monthTitle) {
                monthTitle.onclick = (e) => {
                    e.stopPropagation();
                    this.activeView = 'months';
                    this.render();
                };
            }

            if (yearTitle) {
                yearTitle.onclick = (e) => {
                    e.stopPropagation();
                    this.yearGroupStart = Math.floor(this.viewDate.getFullYear() / 12) * 12;
                    this.activeView = 'years';
                    this.render();
                };
            }

            this.widget.querySelectorAll('.jdp-months-grid .jdp-grid-item').forEach(item => {
                item.onclick = (e) => {
                    e.stopPropagation();
                    const monthIdx = parseInt(item.getAttribute('data-month'), 10);
                    this.viewDate.setMonth(monthIdx);
                    this.activeView = 'days';
                    this.render();
                };
            });

            this.widget.querySelectorAll('.jdp-years-grid .jdp-grid-item').forEach(item => {
                item.onclick = (e) => {
                    e.stopPropagation();
                    const selectedYear = parseInt(item.getAttribute('data-year'), 10);
                    this.viewDate.setFullYear(selectedYear);
                    this.activeView = 'months';
                    this.render();
                };
            });

            this.widget.querySelectorAll('.jdp-calendar-grid .jdp-cell:not(.jdp-other-month)').forEach(cell => {
                cell.onclick = (e) => {
                    e.stopPropagation();
                    const day = parseInt(cell.getAttribute('data-day'), 10);
                    this.selectedDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), day, this.selectedHour, this.selectedMinute);
                    this.commitValue();

                    const hasTime = this.hasTimeComponent();

                    if (this.options.closeOnSelect || !hasTime) {
                        if (!hasTime || this.options.sideBySide) {
                            this.hide();
                            return;
                        } else {
                            this.activeView = 'time';
                        }
                    }
                    this.render();
                };
            });

            this.widget.querySelectorAll('.jdp-time-box').forEach(box => {
                box.onclick = () => {
                    this.timeMode = box.getAttribute('data-target');
                    this.render();
                };
            });

            this.widget.querySelectorAll('.jdp-clock-number').forEach(num => {
                num.onclick = (e) => {
                    e.stopPropagation();
                    const val = parseInt(num.getAttribute('data-val'), 10);
                    if (this.timeMode === 'hours') {
                        if (!this.options.use24Hour) {
                            this.selectedHour = this.period === 'PM' && val < 12 ? val + 12 : (this.period === 'AM' && val === 12 ? 0 : val);
                        } else {
                            this.selectedHour = val;
                        }
                        this.timeMode = 'minutes';
                    } else {
                        this.selectedMinute = val;
                    }
                    
                    this.activeView = 'time';
                    this.commitValue();
                    this.render();
                };
            });

            this.widget.querySelectorAll('.jdp-period-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.period = btn.getAttribute('data-period');
                    if (this.period === 'PM' && this.selectedHour < 12) this.selectedHour += 12;
                    if (this.period === 'AM' && this.selectedHour >= 12) this.selectedHour -= 12;
                    this.commitValue();
                    this.render();
                };
            });

            const todayBtn = this.widget.querySelector('.jdp-btn-today');
            const clearBtn = this.widget.querySelector('.jdp-btn-clear');
            const closeBtn = this.widget.querySelector('.jdp-btn-close');
            const toggleViewBtn = this.widget.querySelector('.jdp-btn-toggle-view');

            if (todayBtn) todayBtn.onclick = () => { this.selectedDate = new Date(); this.viewDate = new Date(); this.activeView = 'days'; this.commitValue(); this.render(); };
            if (clearBtn) clearBtn.onclick = () => { this.selectedDate = null; this.element.value = ''; this.hide(); };
            if (closeBtn) closeBtn.onclick = () => { this.hide(); };
            
            if (toggleViewBtn) {
                toggleViewBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.activeView = this.activeView === 'time' ? 'days' : 'time';
                    this.render();
                };
            }

            this.updateClockHand();
        }

        updateClockHand() {
            const hand = this.widget.querySelector('#jdp-hand');
            if (!hand) return;

            let val = this.timeMode === 'hours' ? (this.selectedHour % 12 || 12) : this.selectedMinute / 5;
            let deg = val * 30;
            hand.style.transform = `rotate(${deg}deg)`;
        }

        commitValue() {
            if (!this.selectedDate) return;

            this.selectedDate.setHours(this.selectedHour);
            this.selectedDate.setMinutes(this.selectedMinute);

            const YYYY = String(this.selectedDate.getFullYear());
            const monthVal = this.selectedDate.getMonth() + 1;
            const dateVal = this.selectedDate.getDate();
            const MM = String(monthVal).padStart(2, '0');
            const DD = String(dateVal).padStart(2, '0');
            const HH = String(this.selectedHour).padStart(2, '0');
            const mm = String(this.selectedMinute).padStart(2, '0');

            const tokens = {
                'YYYY': YYYY,
                'MM': MM,
                'DD': DD,
                'HH': HH,
                'mm': mm,
                'Y': YYYY,
                'm': monthVal,
                'd': dateVal,
                'H': HH,
                'M': mm
            };

            let formatted = this.options.format.replace(/YYYY|MM|DD|HH|mm|Y|m|d|H|M/g, (match) => {
                return tokens[match] !== undefined ? tokens[match] : match;
            });

            this.element.value = formatted;

            if (typeof this.options.onChange === 'function') {
                this.options.onChange(this.selectedDate, formatted);
            }
        }

        bindEvents() {
            if (!this.options.inline) {
				if (this.options.openOnInputClick) {
					this.element.addEventListener('click', (e) => {
						e.stopPropagation();
						this.toggle();
					});
				}

				document.addEventListener('click', (e) => {
					if (this.isOpen && !this.widget.contains(e.target) && e.target !== this.element) {
						this.hide();
					}
				});

				window.addEventListener('resize', () => {
					if (this.isOpen) this.setPosition();
				});

				window.addEventListener('scroll', () => {
					if (this.isOpen) this.setPosition();
				}, true);
			}
        }

        setPosition() {
            const containerNode = this._getContainerNode();
            const isInsideDialog = containerNode && containerNode !== document.body;

            if (this.options.position === 'top' || isInsideDialog) {
                const containerRect = containerNode.getBoundingClientRect();
                const inputRect = this.element.getBoundingClientRect();

                const relativeTop = inputRect.top - containerRect.top + containerNode.scrollTop;
                
                if (this.options.position === 'top') {
                    this.widget.style.top = `${containerNode.scrollTop + 10}px`;
                } else {
                    this.widget.style.top = `${relativeTop + inputRect.height + 4}px`;
                }

                const relativeLeft = inputRect.left - containerRect.left;
                this.widget.style.left = `${Math.max(10, relativeLeft)}px`;
                return;
            }

            const rect = this.element.getBoundingClientRect();
            const widgetHeight = this.widget.offsetHeight || 370;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            let pos = this.options.position;

            if (pos === 'auto') {
                pos = (spaceBelow < widgetHeight && spaceAbove > spaceBelow) ? 'above' : 'below';
            }

            if (pos === 'above') {
                this.widget.style.top = `${rect.top + window.scrollY - widgetHeight - 4}px`;
            } else {
                this.widget.style.top = `${rect.bottom + window.scrollY + 4}px`;
            }

            this.widget.style.left = `${rect.left + window.scrollX}px`;
        }

        show() {
            if (this.isOpen) return;
            this.parseInitialValue();
            this.activeView = 'days';
            this.widget.style.display = 'block';
            this.setPosition();
            
            if (this.options.zIndex) {
                this.widget.style.zIndex = this.options.zIndex;
            }

            this.widget.classList.add('jdp-visible');
            this.isOpen = true;
            if (typeof this.options.onShow === 'function') this.options.onShow();
        }

        hide() {
            if (!this.isOpen || this.options.inline) return;
            this.widget.classList.remove('jdp-visible');
            this.widget.style.display = 'none';
            this.isOpen = false;
            if (typeof this.options.onHide === 'function') this.options.onHide();
        }

        toggle() {
            this.isOpen ? this.hide() : this.show();
        }

        setZIndex(zIndexValue) {
            this.options.zIndex = zIndexValue;
            if (this.widget) {
                this.widget.style.zIndex = zIndexValue;
                this.widget.style.setProperty('--jdp-z-index', zIndexValue);
            }
        }
    }

    // Export to Window
    window.JamDatePicker = JamDatePicker;

    // jQuery Bridge
    if (window.jQuery) {
        window.jQuery.fn.jamDatepicker = function (options) {
            return this.each(function () {
                if (!window.jQuery.data(this, 'jamDatepicker')) {
                    window.jQuery.data(this, 'jamDatepicker', new JamDatePicker(this, options));
                }
            });
        };
    }
}));