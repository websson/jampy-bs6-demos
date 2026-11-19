import consts from "../consts.js";
// table-context-menu.js
// Right-click context menu functionality for table rows

export const contextMenuMethods = {
    /**
     * Initialize context menu for table rows
     * Called from init() after table is created
     */
    init_context_menu() {
		if (!this.item) {
			return;
		}

		const self = this;

		// Listen on $table for any tr right-click
		this.$table.off('contextmenu.dbtable').on('contextmenu.dbtable', 'tr', function(e) {
			e.preventDefault();
			e.stopPropagation();

			const $row = $(this);
			const rec_no = self.record_by_row($row);

			if (rec_no === undefined || rec_no === null) {
				console.warn('Could not determine rec_no for row');
				return false;
			}

			// Select the row first
			self.select_row($row);

			// Navigate item to this record
			if (self.item.rec_no !== rec_no) {
				self.item.rec_no = rec_no;
			}

			// Build and show context menu
			self.show_context_menu(e, $row, rec_no);

			return false;
		});

		// Close menu on outside click
		/*$(document).off('click.dbtable-contextmenu').on('click.dbtable-contextmenu', function(e) {
			self.hide_context_menu();
		});*/
		
		// Global listeners to hide menu on click/scroll anywhere on the page
        $(document).off('.dbtable-contextmenu').on('mousedown.dbtable-contextmenu pointerdown.dbtable-contextmenu scroll.dbtable-contextmenu', function(e) {
            // Do not close if clicking directly inside the active context menu itself
            if (self.$context_menu && $(e.target).closest('.table-context-menu').length) {
                return;
            }
            self.hide_context_menu();
        });
	},

    /**
     * Show context menu at mouse position
     * @param {Event} e - Mouse event
     * @param {jQuery} $row - Table row element
     * @param {number} rec_no - Record number
     */
    show_context_menu(e, $row, rec_no) {
        if (!this.item) {
            return;
        }

        const self = this;
        this.hide_context_menu();

        // 1. Fetch default items
        let menuItems = this.get_default_menu_items(rec_no);

        // 2. Dynamically lookup handler from item or options
        const handler = (this.item.table_options && this.item.table_options.on_get_table_context_menu) ||
                        this.options.on_get_table_context_menu ||
                        this.item.on_get_table_context_menu;

        if (handler) {
            // Call handler and accept returned array
            const customItems = handler.call(this.item, self, rec_no);
            if (customItems && customItems.length) {
                menuItems = customItems;
            }
        }

        if (!menuItems || menuItems.length === 0) {
            return;
        }

        // 3. Render context menu element
        const $menu = this.create_context_menu_element(menuItems, rec_no);
        $menu.css({
            position: 'fixed',
            left: e.clientX + 'px',
            top: e.clientY + 'px',
            zIndex: 10000
        });

        this.adjust_menu_position($menu, e.clientX, e.clientY);
        this.$context_menu = $menu;
        $('body').append($menu);

        setTimeout(function() {
            $menu.addClass('show');
        }, 10);
    },

    /**
     * Get default context menu items
     * @param {number} rec_no - Record number
     * @returns {Array} Menu item configurations
     */
    get_default_menu_items(rec_no) {
        if (!this.item) {
            return [];
        }

        const self = this;
        const items = [];

        // Helper for localized strings falling back to English defaults
        const lang = (task && task.language) ? task.language : {};

        const canEdit = !this.options.read_only && !this.item.read_only && (this.item.can_edit !== false);
        const canCreate = !this.options.read_only && !this.item.read_only && (this.item.can_create !== false);
        const canDelete = !this.options.read_only && !this.item.read_only && (this.item.can_delete !== false);

        if (canEdit) {
            items.push({
                id: 'edit',
                text: lang.edit || 'Edit',
                icon: 'pencil',
                action: function() {
                    self.item.edit_record();
                }
            });
        } else {
            items.push({
                id: 'view',
                text: lang.view || 'View',
                icon: 'eye',
                action: function() {
                    self.item.view_record();
                }
            });
        }

        // Copy
        items.push({
            id: 'copy',
            text: lang.copy || 'Copy',
            icon: 'copy',
            action: function() {
                self.copy_row_to_clipboard(rec_no);
            }
        });

        // Insert
        if (canCreate) {
            items.push({ separator: true });
            items.push({
                id: 'insert',
                text: lang.append || lang.insert || 'Insert',
                icon: 'plus-circle',
                action: function() {
                    self.item.insert_record();
                }
            });
        }

        // Delete
        if (canDelete) {
            items.push({ separator: true });
            items.push({
                id: 'delete',
                text: lang.delete || 'Delete',
                icon: 'trash',
                className: 'text-danger',
                action: function() {
                    self.item.delete_record();
                }
            });
        }
		
		// Customize columns
        items.push({ separator: true });
        items.push({
            id: 'configure_columns',
            text: 'Customize Columns',
            icon: 'gear',
            action: function() {
                self.table_column_palette();
            }
        });

        // Refresh
        items.push({ separator: true });
        items.push({
            id: 'refresh',
            text: lang.refresh || 'Refresh',
            icon: 'arrow-clockwise',
            action: function() {
                self.item.open({ open_empty: false });
            }
        });

        return items;
    },

    /**
     * Create context menu DOM element
     * @param {Array} items - Menu item configurations
     * @param {number} rec_no - Record number
     * @returns {jQuery} Menu element
     */
    create_context_menu_element(items, rec_no) {
		const self = this;
        const $menu = $('<div class="table-context-menu menu"></div>');

        items.forEach(item => {
            if (item.separator) {
                $menu.append('<hr class="menu-divider">');
            } else {
                const icon = item.icon ?
                    `<i class="bi bi-${item.icon} me-2"></i>` : '';

                const $item = $(`
                    <a href="#" class="menu-item ${item.className || ''}" data-action="${item.id}">
                        ${icon}${item.text}
                    </a>
                `);

                $item.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (item.action) {
                        item.action(rec_no);
                    }

                    if (item.id !== 'copy') {
                        const objectName = (self.item && (self.item.item_caption || self.item.item_name)) || 'Item';
                        self.show_copy_notification(`${objectName} selected!`);
                    }

                    // Hide menu after action
                    setTimeout(function() {
                        $menu.remove();
                    }, 100);
                });

                $menu.append($item);
            }
        });

        return $menu;
    },

    /**
     * Adjust menu position if it goes off-screen
     * @param {jQuery} $menu - Menu element
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     */
    adjust_menu_position($menu, x, y) {
        const menuWidth = $menu.outerWidth();
        const menuHeight = $menu.outerHeight();
        const windowWidth = $(window).width();
        const windowHeight = $(window).height();

        let left = x;
        let top = y;

        // Adjust horizontal position
        if (left + menuWidth > windowWidth) {
            left = windowWidth - menuWidth - 10;
        }

        // Adjust vertical position
        if (top + menuHeight > windowHeight) {
            top = windowHeight - menuHeight - 10;
        }

        $menu.css({ left: left + 'px', top: top + 'px' });
    },

    /**
     * Hide and remove context menu
     */
    hide_context_menu() {
        if (this.$context_menu) {
            this.$context_menu.removeClass('show');
            const $menu = this.$context_menu;
            setTimeout(function() {
                $menu.remove();
            }, 200);
            this.$context_menu = null;
        }
    },

    /**
     * Copy row data to clipboard
     * @param {number} rec_no - Record number
     */
    copy_row_to_clipboard(rec_no) {
        if (!this.item) {
            return;
        }

        const self = this;
        const current_rec = this.item.rec_no;

        // Navigate to record
        this.item.rec_no = rec_no;

        // Build text representation
        const lines = [];
        this.fields.forEach(field => {
            const label = field.field_caption || field.field_name;
            const value = field.display_text || '';
            lines.push(`${label}: ${value}`);
        });

        const text = lines.join('\n');

        // Copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                const objectName = (self.item && (self.item.item_caption || self.item.item_name)) || 'Item';
                self.show_copy_notification(`${objectName} copied!`);
            }).catch(err => {
                console.error('Failed to copy:', err);
                self.fallback_copy_to_clipboard(text);
            });
        } else {
            self.fallback_copy_to_clipboard(text);
        }

        // Restore original record
        this.item.rec_no = current_rec;
    },

    /**
     * Fallback copy method for older browsers
     * @param {string} text - Text to copy
     */
    fallback_copy_to_clipboard(text) {
        const $temp = $('<textarea>');
        $temp.val(text);
        $temp.css({
            position: 'fixed',
            opacity: 0,
            top: 0,
            left: 0
        });
        $('body').append($temp);
        $temp.get(0).select();

        try {
            document.execCommand('copy');
            const objectName = (this.item && (this.item.item_caption || this.item.item_name)) || 'Item';
            this.show_copy_notification(`${objectName} copied!`);
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }

        $temp.remove();
    },

    /**
     * Show brief notification toast
     * @param {string} [customText] - Optional custom notification text
     */
    show_copy_notification(customText) {
        const objectName = (this.item && (this.item.item_caption || this.item.item_name)) || 'Item';
        const text = customText || `${objectName} selected!`;
        const $toast = $(`
            <div class="table-copy-toast">
                <i class="bi bi-check-circle me-2"></i>
                ${text}
            </div>
        `);

        $('body').append($toast);

        setTimeout(() => $toast.addClass('show'), 10);
        setTimeout(() => {
            $toast.removeClass('show');
            setTimeout(() => $toast.remove(), 300);
        }, 2000);
    },

    /**
     * Cleanup context menu (called from destroy)
     */
    destroy_context_menu() {
        this.hide_context_menu();

        if (this.$table) {
            this.$table.off('contextmenu.dbtable');
        }

        $(document).off('click.dbtable-contextmenu');
    },
	
	/**
     * Opens Modern Bootstrap 6 Column Palette Dialog
     */
    table_column_palette() {
        const self = this;
        const item = this.item;
        const lang = (typeof task !== 'undefined' && task.language) ? task.language : {};

        // 1. Gather visible field names
        let visibleFieldNames = [];
        if (this.fields && this.fields.length) {
            visibleFieldNames = this.fields.map(f => f.field_name);
        } else if (item.view_options.fields && item.view_options.fields.length) {
            visibleFieldNames = [...item.view_options.fields];
        }

        // 2. Gather available (hidden) columns
        const availableFields = [];
        item.each_field(function(f) {
            if (f.field_name !== item._primary_key && f.field_name !== item._deleted_flag) {
                if (visibleFieldNames.indexOf(f.field_name) === -1) {
                    availableFields.push({ name: f.field_name, caption: f.field_caption || f.field_name });
                }
            }
        });

        // Gather visible field objects with captions
        const selectedFields = visibleFieldNames.map(fieldName => {
            const f = item.field_by_name(fieldName);
            return { name: fieldName, caption: f ? (f.field_caption || fieldName) : fieldName };
        });

        // 3. Construct BS6 <dialog class="dialog"> HTML
        const dialogHtml = `
        <dialog class="dialog dialog-lg jam-column-palette-dialog" aria-hidden="true" data-bs-backdrop="static">
            <div class="dialog-header">
                <h5 class="dialog-title d-flex align-items-center gap-2">
                    <i class="bi bi-columns-nav fg-primary"></i>
                    ${lang.columns_palette || 'Choose columns'}
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="dialog" aria-label="Close"></button>
            </div>
            <div class="dialog-body p-4">
                <div class="row g-3 align-items-stretch">
                    <!-- Left: Available Columns -->
                    <div class="col-md-5 d-flex flex-column">
                        <label class="form-label fw-semibold text-muted mb-1">
                            ${lang.available_fields || 'Available'}
                        </label>
                        <div class="input-group input-group-sm mb-2">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control dsl-search-left" placeholder="${lang.search || 'Search...'}">
                        </div>
                        <select multiple class="form-control dsl-list-left flex-grow-1" style="min-height: 220px;"></select>
                    </div>

                    <!-- Center: Transfer Buttons -->
                    <div class="col-md-2 d-flex flex-column gap-2 justify-content-center align-items-center">
                        <button type="button" class="btn-outline theme-primary btn-sm w-100 dsl-btn-add" aria-label="${lang.add_selected || 'Add selected'}">
                            <i class="bi bi-chevron-right me-1"></i>${lang.add || 'Add'}
                        </button>
                        <button type="button" class="btn-outline theme-primary btn-sm w-100 dsl-btn-add-all" aria-label="${lang.add_all || 'Add all'}">
                            <i class="bi bi-chevron-double-right me-1"></i>${lang.add_all || 'All'}
                        </button>
                        <button type="button" class="btn-outline theme-secondary btn-sm w-100 dsl-btn-remove" aria-label="${lang.remove_selected || 'Remove selected'}">
                            <i class="bi bi-chevron-left me-1"></i>${lang.remove || 'Remove'}
                        </button>
                        <button type="button" class="btn-outline theme-secondary btn-sm w-100 dsl-btn-remove-all" aria-label="${lang.remove_all || 'Remove all'}">
                            <i class="bi bi-chevron-double-left me-1"></i>${lang.remove_all || 'Clear'}
                        </button>
                    </div>

                    <!-- Right: Visible Columns + Reorder -->
                    <div class="col-md-5 d-flex flex-column">
                        <label class="form-label fw-semibold text-muted mb-1">
                            ${lang.visible_fields || 'Visible'}
                        </label>
                        <div class="input-group input-group-sm mb-2">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control dsl-search-right" placeholder="${lang.search || 'Search...'}">
                        </div>
                        <select multiple class="form-control dsl-list-right flex-grow-1" style="min-height: 220px;"></select>
                        <div class="d-flex gap-2 mt-2">
                            <button type="button" class="btn-outline theme-secondary btn-sm flex-fill dsl-btn-up">
                                <i class="bi bi-arrow-up me-1"></i>${lang.move_up || 'Up'}
                            </button>
                            <button type="button" class="btn-outline theme-secondary btn-sm flex-fill dsl-btn-down">
                                <i class="bi bi-arrow-down me-1"></i>${lang.move_down || 'Down'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="dialog-footer">
                <button type="button" class="btn-solid theme-primary dsl-btn-apply">${lang.apply || 'Apply'}</button>
                <button type="button" class="btn-outline theme-secondary" data-bs-dismiss="dialog">${lang.cancel || 'Cancel'}</button>
            </div>
        </dialog>`;

        const $dialog = $(dialogHtml);
        $('body').append($dialog);

        const $leftList = $dialog.find('.dsl-list-left');
        const $rightList = $dialog.find('.dsl-list-right');
        const $leftSearch = $dialog.find('.dsl-search-left');
        const $rightSearch = $dialog.find('.dsl-search-right');

        // Populate Left List
        availableFields.forEach(f => {
            $leftList.append(`<option value="${f.name}">${f.caption}</option>`);
        });

        // Populate Right List
        selectedFields.forEach(f => {
            $rightList.append(`<option value="${f.name}">${f.caption}</option>`);
        });

        // Search Filter Event
        $leftSearch.on('input', function() {
            const val = $(this).val().toLowerCase();
            $leftList.find('option').each(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
            });
        });

        $rightSearch.on('input', function() {
            const val = $(this).val().toLowerCase();
            $rightList.find('option').each(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
            });
        });

        // Transfer Actions
        $dialog.find('.dsl-btn-add').on('click', function() {
            $leftList.find('option:selected').appendTo($rightList);
        });

        $dialog.find('.dsl-btn-add-all').on('click', function() {
            $leftList.find('option:visible').appendTo($rightList);
        });

        $dialog.find('.dsl-btn-remove').on('click', function() {
            $rightList.find('option:selected').appendTo($leftList);
        });

        $dialog.find('.dsl-btn-remove-all').on('click', function() {
            $rightList.find('option:visible').appendTo($leftList);
        });

        // Double Click Shortcuts
        $leftList.on('dblclick', 'option', function() {
            $(this).appendTo($rightList);
        });

        $rightList.on('dblclick', 'option', function() {
            $(this).appendTo($leftList);
        });

        // Ordering Actions
        $dialog.find('.dsl-btn-up').on('click', function() {
            $rightList.find('option:selected').each(function() {
                const $opt = $(this);
                const $prev = $opt.prev();
                if ($prev.length) {
                    $opt.insertBefore($prev);
                }
            });
        });

        $dialog.find('.dsl-btn-down').on('click', function() {
            $($rightList.find('option:selected').get().reverse()).each(function() {
                const $opt = $(this);
                const $next = $opt.next();
                if ($next.length) {
                    $opt.insertAfter($next);
                }
            });
        });

        // Helper to obtain Bootstrap 6 Dialog instance
        function getDialogInstance(el) {
            if (window.bootstrap && bootstrap.Dialog) {
                return bootstrap.Dialog.getOrCreateInstance(el);
            }
            return null;
        }

        // Apply Changes Button
        $dialog.find('.dsl-btn-apply').on('click', function() {
            const newFields = [];
            $rightList.find('option').each(function() {
                newFields.push($(this).val());
            });

            // Update item view options & table options
            item.view_options.fields = newFields;
            if (self.options) {
                self.options.fields = newFields;
            }

            // Close and remove dialog
            const dialogEl = $dialog.get(0);
            const dialogInst = getDialogInstance(dialogEl);
            if (dialogInst) {
                dialogInst.hide();
            }
            if (dialogEl.close) {
                dialogEl.close();
            }
            $dialog.remove();

            // Reset container and recreate DBTable with new columns
            const $container = self.$container;
            const options = $.extend({}, self.options, { fields: newFields });
            const masterTable = self.master_table;

            $container.empty();

            // Re-instantiate DBTable
            const DBTableClass = self.constructor;
            new DBTableClass(item, $container, options, masterTable);
        });

        // Cleanup DOM on Dialog Hidden
        $dialog.on('hidden.bs.dialog', function() {
            $dialog.remove();
        });

        // Show BS6 Dialog
        const bsDialog = getDialogInstance($dialog.get(0));
        if (bsDialog) {
            bsDialog.show();
        } else {
            // Native HTML5 dialog fallback
            $dialog.get(0).showModal();
        }
    }
};
