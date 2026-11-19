// Example: How table-context-menu.js integrates with the folder-based architecture

/*
FILE STRUCTURE:
modules_bs6/
├── table/
│   ├── index.js              ← Main DBTable class
│   ├── table-init.js         ← init(), init_fields()
│   ├── table-lifecycle.js    ← destroy(), cleanup
│   ├── table-context-menu.js ← Context menu (NEW)
│   └── ...other modules
*/

// ============================================
// 1. In table/index.js - Import the context menu module
// ============================================

import { contextMenuMethods } from './table-context-menu.js';
import { initMethods } from './table-init.js';
import { lifecycleMethods } from './table-lifecycle.js';
// ...other imports

class DBTable {
    constructor(item, container, options) {
        this.item = item;
        this.container = container;
        this.options = options;
        // ...other initialization
    }
}

// Mix in all method groups
Object.assign(DBTable.prototype, 
    initMethods,
    lifecycleMethods,
    contextMenuMethods,  // ← Add context menu methods
    // ...other method groups
);

export default DBTable;

// ============================================
// 2. In table/table-init.js - Initialize context menu
// ============================================

export const initMethods = {
    init() {
        if (!this.item) {
            return;
        }

        // Existing initialization...
        this.create_table();
        this.init_fields();
        this.bind_events();

        // Initialize context menu (NEW)
        this.init_context_menu();  // ← Call during init

        // Continue with existing init...
    },

    // ...other init methods
};

// ============================================
// 3. In table/table-lifecycle.js - Cleanup context menu
// ============================================

export const lifecycleMethods = {
    destroy() {
        // Cleanup context menu FIRST (NEW)
        this.destroy_context_menu();  // ← Call during destroy

        // Existing cleanup...
        if (this.resize_observer) {
            this.resize_observer.disconnect();
            this.resize_observer = null;
        }

        if (this.sync_freezed_debounced) {
            clearTimeout(this.sync_freezed_debounced);
            this.sync_freezed_debounced = null;
        }

        // Unbind all events
        if (this.$table) {
            this.$table.off('.dbtable');
        }

        if (this.$element) {
            this.$element.off('.dbtable');
        }

        // Clear references
        this.item = null;
        this.$element = null;
        this.$table = null;
        // ...other cleanup
    },

    // ...other lifecycle methods
};

// ============================================
// 4. CUSTOMIZATION EXAMPLES
// ============================================

// Example 1: Custom menu via item event handler
// In your application code (e.g., catalogs.js):

function on_view_form_created(item) {
    item.table_options.on_get_context_menu = function(table, rec_no) {
        return [
            {
                id: 'custom-action',
                text: 'My Custom Action',
                icon: 'star',
                action: function() {
                    alert('Custom action for record ' + rec_no);
                }
            },
            { separator: true },
            {
                id: 'open-details',
                text: 'View Details',
                icon: 'info-circle',
                action: function() {
                    item.view_record();
                }
            }
        ];
    };
}

// Example 2: Extend default menu via item method
// In your application code:

function on_view_form_created(item) {
    item.on_get_table_context_menu = function(table, rec_no) {
        const defaultItems = table.get_default_menu_items(rec_no);
        
        // Add custom items at the top
        const customItems = [
            {
                id: 'export-row',
                text: 'Export Row',
                icon: 'download',
                action: function() {
                    exportRowAsCSV(table, rec_no);
                }
            },
            { separator: true }
        ];
        
        return customItems.concat(defaultItems);
    };
}

function exportRowAsCSV(table, rec_no) {
    const current_rec = table.item.rec_no;
    table.item.rec_no = rec_no;
    
    const values = table.fields.map(field => {
        return field.display_text || '';
    });
    
    const csv = values.join(',');
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'row-' + rec_no + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    table.item.rec_no = current_rec;
}

// Example 3: Completely replace menu for specific tables
// In your application code:

function on_view_form_created(item) {
    if (item.item_name === 'invoices') {
        item.table_options.on_get_context_menu = function(table, rec_no) {
            return [
                {
                    id: 'print-invoice',
                    text: 'Print Invoice',
                    icon: 'printer',
                    action: function() {
                        printInvoice(rec_no);
                    }
                },
                {
                    id: 'email-invoice',
                    text: 'Email Invoice',
                    icon: 'envelope',
                    action: function() {
                        emailInvoice(rec_no);
                    }
                },
                { separator: true },
                {
                    id: 'mark-paid',
                    text: 'Mark as Paid',
                    icon: 'check-circle',
                    className: 'text-success',
                    action: function() {
                        markInvoicePaid(rec_no);
                    }
                }
            ];
        };
    }
}

// ============================================
// 5. ARCHITECTURE BENEFITS
// ============================================

/*
Why this design works well with Option A:

1. SEPARATION OF CONCERNS
   - Context menu logic isolated in table-context-menu.js
   - Easy to find and modify
   - No cluttering the main index.js

2. CLEAN INTEGRATION
   - Simple Object.assign() in index.js
   - No complex inheritance
   - All methods available on DBTable instances

3. LIFECYCLE MANAGEMENT
   - init_context_menu() called during table initialization
   - destroy_context_menu() called during cleanup
   - No memory leaks

4. EXTENSIBILITY
   - Two customization hooks: on_get_context_menu (options) and on_get_table_context_menu (item)
   - Can replace or extend default menu
   - Per-table or per-item customization

5. REUSABILITY
   - Default menu items cover common operations
   - Copy-to-clipboard works for any table
   - Positioning logic handles edge cases

6. MAINTAINABILITY
   - All context menu code in one file (~387 lines)
   - Clear method names
   - Well-documented with JSDoc comments
   - Easy to test independently
*/
