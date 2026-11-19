import consts from "../consts.js";

export const columnDragMethods = {
    /**
     * Initializes Ctrl+Click horizontal column drag-and-drop
     */
    init_drag_columns() {
        if (!this.item) {
            return;
        }

        const self = this;
        let $th = null;
        let fieldName = null;
        let $dragGhost = null;
        let $targetIndicator = null;
        let startX = 0;
        let isDragging = false;
        let sourceIndex = -1;
        let targetIndex = -1;

        // Bind mousedown to table header cells
        this.$outer_table.off('mousedown.table-col-drag', 'thead tr:first th').on('mousedown.table-col-drag', 'thead tr:first th', function(e) {
            // Requires Ctrl key press + drag_columns enabled
            if (!e.ctrlKey || !self.options.drag_columns) {
                return;
            }

            $th = $(this);
            fieldName = $th.data('field_name');

            // Skip multi-select column or empty headers
            if (!fieldName) {
                return;
            }

            // Verify if field is explicitly allowed when draggable_fields is defined
            if (self.options.draggable_fields && self.options.draggable_fields.length) {
                if (self.options.draggable_fields.indexOf(fieldName) === -1) {
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();

            startX = e.clientX;
            sourceIndex = self.fields.findIndex(f => f.field_name === fieldName);

            if (sourceIndex === -1) {
                return;
            }

            // Attach document drag listeners
            $(document).on('mousemove.col-drag-active', handleMouseMove);
            $(document).on('mouseup.col-drag-active', handleMouseUp);
        });

        function handleMouseMove(e) {
            const deltaX = Math.abs(e.clientX - startX);

            // Drag threshold (5px)
            if (!isDragging && deltaX > 5) {
                isDragging = true;
                createGhostElement(e);
                createTargetIndicator();
            }

            if (isDragging) {
                // Keep ghost element horizontal movement bound to window
                $dragGhost.css({
                    left: (e.clientX + 10) + 'px'
                });

                // Determine target drop column position based on X coordinate
                findTargetColumn(e.clientX);
            }
        }

        function findTargetColumn(mouseX) {
            const $headers = self.$outer_table.find('thead tr:first th[data-field_name]');
            let closestDist = Infinity;
            let closestIndex = sourceIndex;
            let indicatorLeft = 0;

            $headers.each(function(idx) {
                const $cell = $(this);
                const cellFieldName = $cell.data('field_name');

                // Check restriction
                if (self.options.draggable_fields && self.options.draggable_fields.length) {
                    if (self.options.draggable_fields.indexOf(cellFieldName) === -1) {
                        return;
                    }
                }

                const offset = $cell.offset();
                const width = $cell.outerWidth();
                const midX = offset.left + (width / 2);
                const dist = Math.abs(mouseX - midX);

                if (dist < closestDist) {
                    closestDist = dist;
                    closestIndex = self.fields.findIndex(f => f.field_name === cellFieldName);
                    if (mouseX < midX) {
                        indicatorLeft = offset.left;
                    } else {
                        indicatorLeft = offset.left + width;
                    }
                }
            });

            targetIndex = closestIndex;
            if ($targetIndicator) {
                $targetIndicator.css({
                    left: indicatorLeft + 'px'
                }).show();
            }
        }

        function handleMouseUp(e) {
            $(document).off('mousemove.col-drag-active');
            $(document).off('mouseup.col-drag-active');

            if (isDragging) {
                cleanupDragElements();

                if (targetIndex !== -1 && sourceIndex !== targetIndex) {
                    self.reorder_column(sourceIndex, targetIndex);
                }
            }

            isDragging = false;
            $th = null;
            fieldName = null;
        }

        function createGhostElement(e) {
            const width = $th.outerWidth();
            const height = $th.outerHeight();
            const text = $th.text().trim();

            $dragGhost = $(`
                <div class="table-col-drag-ghost bg-primary text-white px-3 py-2 rounded shadow-sm opacity-75 fw-bold" 
                     style="position: fixed; top: ${e.clientY + 10}px; left: ${e.clientX + 10}px; z-index: 10050; pointer-events: none; width: ${width}px; height: ${height}px;">
                     <i class="bi bi-arrows-move me-2"></i>${text}
                </div>
            `);

            $('body').append($dragGhost);
        }

        function createTargetIndicator() {
            const tableOffset = self.$outer_table.offset();
            const tableHeight = self.$element.outerHeight();

            $targetIndicator = $(`
                <div class="table-col-drag-indicator bg-primary" 
                     style="position: absolute; top: ${tableOffset.top}px; height: ${tableHeight}px; width: 3px; z-index: 10040; display: none;">
                </div>
            `);

            $('body').append($targetIndicator);
        }

        function cleanupDragElements() {
            if ($dragGhost) {
                $dragGhost.remove();
                $dragGhost = null;
            }
            if ($targetIndicator) {
                $targetIndicator.remove();
                $targetIndicator = null;
            }
        }
    },

    /**
     * Reorders table fields array and refreshes view
     */
    reorder_column(fromIndex, toIndex) {
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
            return;
        }

        const item = this.item;
        if (!item) {
            return;
        }

        const fieldNames = this.fields.map(f => f.field_name);
        const movedField = fieldNames.splice(fromIndex, 1)[0];
        fieldNames.splice(toIndex, 0, movedField);

        // Update item view_options & DBTable options
        item.view_options.fields = fieldNames;
        if (this.options) {
            this.options.fields = fieldNames;
        }

        const $container = this.$container;
        const options = $.extend({}, this.options, { fields: fieldNames });
        const masterTable = this.master_table;
        const DBTableClass = this.constructor;

        // Ensure current instance is unregistered from item controls
        if (item.controls) {
            const idx = item.controls.indexOf(this);
            if (idx !== -1) {
                item.controls.splice(idx, 1);
            }
        }

        // Empty container (triggers self.destroy())
        $container.empty();

        // Re-instantiate DBTable (constructor registers itself to item.controls automatically)
        new DBTableClass(item, $container, options, masterTable);
    }
};