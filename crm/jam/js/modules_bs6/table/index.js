import consts from "../consts.js";
import {DBTableInput} from "../input.js";
import {highlight} from "../input.js";

import { initMethods } from './table-init.js';
import { lifecycleMethods } from './table-lifecycle.js';
import { creationMethods } from './table-creation.js';
import { renderingMethods } from './table-rendering.js';
import { syncMethods } from './table-sync.js';
import { selectionMethods } from './table-selection.js';
import { editingMethods } from './table-editing.js';
import { fieldMethods } from './table-field.js';
import { scrollingMethods } from './table-scrolling.js';
import { navigationMethods } from './table-navigation.js';
import { paginationMethods } from './table-pagination.js';
import { summaryMethods } from './table-summary.js';
import { columnMethods } from './table-column.js';
import { searchMethods } from './table-search.js';
import { keyboardMethods } from './table-keyboard.js';
import { rowMethods } from './table-row.js';
import { utilsMethods } from './table-utils.js';
import { contextMenuMethods } from './table-context-menu.js';
import { columnDragMethods } from './table-column-drag.js';

class DBTable {
    constructor(item, container, options, master_table) {
        this.init(item, container, options, master_table);
    }
}

// Mix in all method groups to DBTable prototype
Object.assign(DBTable.prototype,
    initMethods,
    lifecycleMethods,
    creationMethods,
    renderingMethods,
    syncMethods,
    selectionMethods,
    editingMethods,
    fieldMethods,
    scrollingMethods,
    navigationMethods,
    paginationMethods,
    summaryMethods,
    columnMethods,
    searchMethods,
    keyboardMethods,
    rowMethods,
    utilsMethods,
    contextMenuMethods,
	columnDragMethods
);

// Restore getters that were converted to methods to avoid Object.assign evaluation errors
Object.defineProperty(DBTable.prototype, 'editable_fields', {
    get() { return this.get_editable_fields(); },
    configurable: true,
    enumerable: true
});

export default DBTable;
