import consts from "../consts.js";
export const lifecycleMethods = {
    destroy() {
        // Clean up context menu first
        if (this.destroy_context_menu) {
            this.destroy_context_menu();
        }

        // Clean up ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // Clear all timers
        if (this.scroll_timeout) {
            clearTimeout(this.scroll_timeout);
            this.scroll_timeout = null;
        }
        if (this.scroll_debounce) {
            clearTimeout(this.scroll_debounce);
            this.scroll_debounce = null;
        }
        if (this.scrolling) {
            clearTimeout(this.scrolling);
            this.scrolling = null;
        }
        if (this._sync_debounce_timer) {
            clearTimeout(this._sync_debounce_timer);
            this._sync_debounce_timer = null;
        }

        // Remove all event listeners with namespaces
        if (this.$element) {
            this.$element.off('.dbtable');
        }
        if (this.$table) {
            this.$table.off('.dbtable');
        }
        if (this.$overlay_div) {
            this.$overlay_div.off('.dbtable');
        }
        if (this.$outer_table) {
            this.$outer_table.off('.dbtable');
        }

        // Clean up editor
        if (this.editor) {
            this.hide_editor();
            this.editor = null;
        }

        // Clean up tooltips
        if (this.$element) {
            this.$element.find('[data-bs-toggle="tooltip"]').each(function() {
                var tooltip = bootstrap.Tooltip.getInstance(this);
                if (tooltip) {
                    tooltip.dispose();
                }
            });
        }

        // Clear references
        this.item = null;
        this.datasource = [];
        this.fields = [];
        this._editable_fields = [];
        this._sorted_fields = [];
    },

    resize() {
        if (this.column_resizing || this.$container.width() === 0 ||
            (this.cur_width === this.$container.width() &&
            this.cur_height === this.$container.height())) {
                return;
        }
        let self = this;
        clearTimeout(this.timeOut);
        self.timeOut = setTimeout(
            function() {
                if (self.master_table && !self.master_table.freezed_table) {
                    return;
                }
                self.build();
                self.sync_freezed();
            },
            100
        );
    }
};
