// CLIENT CODE EXAMPLES - How to use context menu in Jam.py applications

// ============================================
// EXAMPLE 1: Basic Usage - No customization needed
// ============================================

// The context menu works automatically on any table!
// Just create a table normally:

function on_view_form_created(item) {
    var table = item.create_table(item.view_form.find('.view-table'), {
        height: 600,
        // Context menu is enabled by default - no extra config needed
    });
}

// Right-click on any table row → context menu appears with:
// - Edit (if can_modify)
// - View (if can_view)
// - Copy
// - Insert (if can_create)
// - Delete (if can_delete)
// - Refresh


// ============================================
// EXAMPLE 2: Add Custom Menu Items (Keep defaults + add yours)
// ============================================

function on_view_form_created(item) {
    // Option A: Set on table options (preferred for specific tables)
    item.table_options.on_get_context_menu = function(table, rec_no) {
        // Get the default menu
        var defaultItems = table.get_default_menu_items(rec_no);

        // Add your custom items at the top
        var customItems = [
            {
                id: 'print-record',
                text: 'Print Record',
                icon: 'printer',
                action: function() {
                    print_record(item, rec_no);
                }
            },
            {
                id: 'export-pdf',
                text: 'Export as PDF',
                icon: 'file-pdf',
                action: function() {
                    export_to_pdf(item, rec_no);
                }
            },
            { separator: true }  // Visual separator
        ];

        // Return custom items + default items
        return customItems.concat(defaultItems);
    };
}

function print_record(item, rec_no) {
    var current = item.rec_no;
    item.rec_no = rec_no;

    // Your print logic here
    window.print();

    item.rec_no = current;
}

function export_to_pdf(item, rec_no) {
    var current = item.rec_no;
    item.rec_no = rec_no;

    // Navigate to PDF export page/endpoint
    window.open('/api/export_pdf/' + item.id.value, '_blank');

    item.rec_no = current;
}


// ============================================
// EXAMPLE 3: Completely Custom Menu (Replace defaults)
// ============================================

function on_view_form_created(item) {
    if (item.item_name === 'invoices') {
        item.table_options.on_get_context_menu = function(table, rec_no) {
            var current = item.rec_no;
            item.rec_no = rec_no;

            var status = item.status.value;
            var is_paid = (status === 'paid');

            item.rec_no = current;

            return [
                {
                    id: 'view-invoice',
                    text: 'View Invoice',
                    icon: 'eye',
                    action: function() {
                        item.rec_no = rec_no;
                        item.view_record();
                    }
                },
                {
                    id: 'print-invoice',
                    text: 'Print Invoice',
                    icon: 'printer',
                    action: function() {
                        print_invoice(rec_no);
                    }
                },
                {
                    id: 'email-invoice',
                    text: 'Email to Customer',
                    icon: 'envelope',
                    action: function() {
                        email_invoice(rec_no);
                    }
                },
                { separator: true },
                {
                    id: 'mark-paid',
                    text: is_paid ? 'Paid ✓' : 'Mark as Paid',
                    icon: 'check-circle',
                    className: is_paid ? 'text-success' : '',
                    action: function() {
                        if (!is_paid) {
                            mark_invoice_paid(rec_no);
                        }
                    }
                },
                { separator: true },
                {
                    id: 'delete',
                    text: 'Delete Invoice',
                    icon: 'trash',
                    className: 'text-danger',
                    action: function() {
                        if (confirm('Delete this invoice?')) {
                            item.rec_no = rec_no;
                            item.delete_record();
                        }
                    }
                }
            ];
        };
    }
}


// ============================================
// EXAMPLE 4: Item-Level Handler (Applies to ALL tables of this item)
// ============================================

function on_view_form_created(item) {
    // This applies to every table created for this item
    item.on_get_table_context_menu = function(table, rec_no) {
        var items = table.get_default_menu_items(rec_no);

        // Add "Duplicate" option for all tables
        items.splice(1, 0, {
            id: 'duplicate',
            text: 'Duplicate Record',
            icon: 'files',
            action: function() {
                duplicate_record(item, rec_no);
            }
        });

        return items;
    };
}

function duplicate_record(item, rec_no) {
    var current = item.rec_no;
    item.rec_no = rec_no;

    // Copy field values
    var field_values = {};
    item.each_field(function(field) {
        if (!field.is_primary_key()) {
            field_values[field.field_name] = field.value;
        }
    });

    item.rec_no = current;

    // Create new record with copied values
    item.insert_record();
    for (var field_name in field_values) {
        item.field_by_name(field_name).value = field_values[field_name];
    }
}


// ============================================
// EXAMPLE 5: Conditional Items Based on Record Data
// ============================================

function on_view_form_created(item) {
    if (item.item_name === 'orders') {
        item.table_options.on_get_context_menu = function(table, rec_no) {
            var current = item.rec_no;
            item.rec_no = rec_no;

            var status = item.order_status.value;
            var customer_id = item.customer.value;

            item.rec_no = current;

            var menu = [];

            // Always show view
            menu.push({
                id: 'view',
                text: 'View Order',
                icon: 'eye',
                action: function() {
                    item.rec_no = rec_no;
                    item.view_record();
                }
            });

            // Show "Ship Order" only for pending orders
            if (status === 'pending') {
                menu.push({
                    id: 'ship',
                    text: 'Ship Order',
                    icon: 'truck',
                    action: function() {
                        ship_order(item, rec_no);
                    }
                });
            }

            // Show "Cancel Order" only for unshipped orders
            if (status !== 'shipped' && status !== 'cancelled') {
                menu.push({
                    id: 'cancel',
                    text: 'Cancel Order',
                    icon: 'x-circle',
                    className: 'text-warning',
                    action: function() {
                        cancel_order(item, rec_no);
                    }
                });
            }

            menu.push({ separator: true });

            // Show customer info
            menu.push({
                id: 'customer',
                text: 'View Customer',
                icon: 'person',
                action: function() {
                    show_customer(customer_id);
                }
            });

            return menu;
        };
    }
}


// ============================================
// EXAMPLE 6: Master-Detail Context Menu
// ============================================

function on_edit_form_created(item) {
    // Context menu for detail table in edit form
    if (item.item_name === 'orders') {
        item.order_lines.table_options.on_get_context_menu = function(table, rec_no) {
            var items = table.get_default_menu_items(rec_no);

            // Add "View Product" option
            items.splice(0, 0, {
                id: 'view-product',
                text: 'View Product Details',
                icon: 'box',
                action: function() {
                    var current = item.order_lines.rec_no;
                    item.order_lines.rec_no = rec_no;

                    var product_id = item.order_lines.product.value;

                    item.order_lines.rec_no = current;

                    // Open product in new window or modal
                    task.products.open({filter: {id: product_id}});
                    task.products.view_record();
                }
            });

            return items;
        };
    }
}


// ============================================
// EXAMPLE 7: Disable Context Menu for Specific Table
// ============================================

function on_view_form_created(item) {
    // Return empty array to disable context menu
    item.table_options.on_get_context_menu = function(table, rec_no) {
        return [];  // No context menu
    };
}


// ============================================
// EXAMPLE 8: Context Menu with AJAX Actions
// ============================================

function on_view_form_created(item) {
    if (item.item_name === 'tasks') {
        item.table_options.on_get_context_menu = function(table, rec_no) {
            var current = item.rec_no;
            item.rec_no = rec_no;

            var is_completed = item.completed.value;

            item.rec_no = current;

            return [
                {
                    id: 'view',
                    text: 'View Task',
                    icon: 'eye',
                    action: function() {
                        item.rec_no = rec_no;
                        item.view_record();
                    }
                },
                { separator: true },
                {
                    id: 'toggle-complete',
                    text: is_completed ? 'Mark Incomplete' : 'Mark Complete',
                    icon: is_completed ? 'square' : 'check-square',
                    action: function() {
                        toggle_task_completion(item, rec_no);
                    }
                },
                {
                    id: 'assign',
                    text: 'Assign to User',
                    icon: 'person-plus',
                    action: function() {
                        assign_task(item, rec_no);
                    }
                }
            ];
        };
    }
}

function toggle_task_completion(item, rec_no) {
    // Call server to update
    $.ajax({
        url: '/api/toggle_task_completion',
        method: 'POST',
        data: {
            task_id: rec_no
        },
        success: function(response) {
            // Refresh the table
            item.open({open_empty: false});
        },
        error: function(xhr) {
            alert('Error: ' + xhr.responseText);
        }
    });
}


// ============================================
// EXAMPLE 9: Multi-Level Submenus (Advanced)
// ============================================

// Note: The current implementation supports flat menus only.
// For submenus, you'd need to extend table-context-menu.js
// But here's a workaround using cascading menus:

function on_view_form_created(item) {
    item.table_options.on_get_context_menu = function(table, rec_no) {
        return [
            {
                id: 'view',
                text: 'View Record',
                icon: 'eye',
                action: function() {
                    item.rec_no = rec_no;
                    item.view_record();
                }
            },
            { separator: true },
            {
                id: 'export-options',
                text: 'Export as...',
                icon: 'download',
                action: function() {
                    show_export_submenu(item, rec_no, table);
                }
            }
        ];
    };
}

function show_export_submenu(item, rec_no, table) {
    // Hide current menu
    table.hide_context_menu();

    // Show new menu with export options
    var export_items = [
        {
            id: 'export-pdf',
            text: 'PDF',
            icon: 'file-pdf',
            action: function() {
                export_as_pdf(item, rec_no);
            }
        },
        {
            id: 'export-excel',
            text: 'Excel',
            icon: 'file-excel',
            action: function() {
                export_as_excel(item, rec_no);
            }
        },
        {
            id: 'export-csv',
            text: 'CSV',
            icon: 'file-text',
            action: function() {
                export_as_csv(item, rec_no);
            }
        }
    ];

    // You'd need to position and show this manually
    // or extend the context menu implementation
}


// ============================================
// SUMMARY: Menu Item Structure
// ============================================

/*
Each menu item is an object with:

{
    id: 'unique-identifier',        // Required - unique ID
    text: 'Display Text',           // Required - what user sees
    icon: 'bootstrap-icon-name',    // Optional - Bootstrap icon (without 'bi-' prefix)
    className: 'css-class',         // Optional - additional CSS classes (e.g., 'text-danger')
    action: function() {            // Required - function to call on click
        // Your code here
    }
}

OR for separators:

{ separator: true }

Available Bootstrap Icons (examples):
- 'pencil', 'eye', 'trash', 'plus-circle', 'copy', 'download'
- 'printer', 'envelope', 'check-circle', 'x-circle'
- 'arrow-clockwise', 'files', 'box', 'person', 'truck'
- Full list: https://icons.getbootstrap.com/
*/
