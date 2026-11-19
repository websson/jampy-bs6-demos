import consts from "../consts.js";
export const syncMethods = {
    sync_freezed() {
        var self = this;

        // Debounce sync_freezed to prevent excessive calls
        if (this._sync_debounce_timer) {
            clearTimeout(this._sync_debounce_timer);
        }

        this._sync_debounce_timer = setTimeout(function() {
            self._sync_freezed_impl();
            self._sync_debounce_timer = null;
        }, 16); // ~60fps
    },

    _sync_freezed_impl() {
        var i,
            col,
            $th,
            $td,
            $tf,
            cell_width,
            field_name,
            fields1,
            fields2,
            valid_fields,
            scroll_left,
            title_height,
            width;
        if (this.options.freeze_count) {
            if (this.freezed_table) {
                fields1 = this.get_freezed_fields();
                fields2 = this.freezed_table.get_freezed_fields(this.options.freeze_count);
                valid_fields = fields1.length === fields2.length;
                if (valid_fields) {
                    for (i = 0; i < fields1.length; i++) {
                        if (fields1[i] !== fields2[i]) {
                            valid_fields = false;
                            break;
                        }
                    }
                }
                if (!valid_fields) {
                    this.delete_freezed_table();
                }
            }
            if (this.$overlay_div.get(0).scrollWidth > this.$element.innerWidth()) {
                if (!this.freezed_table) {
                    this.create_freezed_table();
                }
                col = this.options.freeze_count - 1;
                if (this.options.multiselect) {
                    col += 1;
                }
                $th = this.$head.find('th').eq(col);
                width = ($th.position().left + $th.outerWidth(true) + 2);

                this.freezed_table.$element.width(width);
            }
            else if (this.freezed_table) {
                this.delete_freezed_table();
            }
        }
        else {
            if (this.master_table) {
                this.$head.height(this.master_table.$head.height());
                this.$foot.height(this.master_table.$foot.height());
                for (i = 0; i < this.fields.length; i++) {
                    field_name = this.fields[i].field_name;
                    cell_width = this.master_table.$head.find('th.' + field_name).outerWidth();
                     this.set_сell_width(field_name, cell_width);
                }
                this.sync_col_width();
            }
        }
     },

    syncronize(noscroll) {
        if (!this.item) {
            return;
        }
        var self = this,
            page_rec,
            row_changed,
            clone,
            row = this.row_by_record();
        if (this.syncronizing) {
            if (row) {
                this.select_row(row);
            }
        }
        else if (this.item.controls_enabled() && this.item.record_count() > 0) {
            this.syncronizing = true;
            try {
                if (!row && this.datasource.length && !this.item.paginate) {
                    this.datasource = [];
                    if (this.item.filter_active()) {
                        page_rec = this.item.rec_no;
                    }
                    else {
                        page_rec = Math.floor((this.item.rec_no) / this.row_count) * this.row_count;
                    }
                    this.fill_datasource(page_rec)
                    if (this.datasource.length < this.row_count && this.item.rec_count > this.row_count) {
                        clone = this.item.clone(true);
                        clone.last();
                        for (var i = 1; i < this.row_count; i++) {
                            if (!clone.bof()) {
                                clone.prior();
                            }
                        }
                        page_rec = clone.rec_no;
                        this.datasource = [];
                        this.fill_datasource(page_rec)
                    }
                    this.refresh();
                    row = this.row_by_record();
                }
                row_changed = !this.selected_row || (this.selected_row && row && this.selected_row.get(0) !== row.get(0));
                if (row_changed && this.can_edit()) {
                    this.hide_editor();
                }
                try {
                    this.select_row(this.row_by_record());
                } catch (e) {}
                if (!noscroll) {
                    this.table_scroll = true;
                    this.$overlay_div.scrollTop(this.scroll_pos_by_rec());
                }
            }
            finally {
                this.syncronizing = false;
            }
        }
    },

    syncronize_tables() {
        this.syncronize();
        if (this.master_table) {
            this.master_table.syncronize();
        }
        if (this.freezed_table) {
            this.freezed_table.syncronize();
        }
    },

    cancel_sync() {
        this.set_sync(true);
    },

    resume_sync() {
        this.set_sync(false);
    },

    set_sync(value) {
        this.syncronizing = value;
        if (this.freezed_table) {
            this.freezed_table.syncronizing = value;
        }
        if (this.master_table) {
            this.master_table.syncronizing = value;
        }
    }
};
