import consts from "../consts.js";
export const rowMethods = {
    row_by_record() {
        if (this.item && this.item.rec_count) {
            for (var i = 0; i < this.datasource.length; i++) {
                if (this.datasource[i][0] === this.item.rec_no) {
                    return $(this.datasource[i][1])
                }
            }
        }
    },

    record_by_row(row) {
        for (var i = 0; i < this.datasource.length; i++) {
            if (this.datasource[i][1] === row[0]) {
                return this.datasource[i][0]
            }
        }
    },

    refresh_row() {
        var self = this;
        this.each_field(function(field, i) {
            self.update_field(field, true);
        });
    },

    update_selected(row) {
        if (!row) {
            row = this.row_by_record();
        }
        if (this.options.row_callback) {
            this.options.row_callback(row, this.item);
        }
    },

    clicked(e, td) {
        var rec,
            field = this.item.field_by_name(td.data('field_name')),
            $row = td.parent();
        rec = this.record_by_row($row);
        if (rec !== undefined) {
            if (this.edit_mode && rec !== this.item.rec_no) {
                this.close_editor();
            }
            this.item.rec_no = rec;
            if (!this.editing && !this.is_focused()) {
                this.focus();
            }
            if (field) {
                this.set_selected_field(field);
            }
            if (e.type === "dblclick") {
                this.do_on_edit(field);
            }
        }
    },

    table_focused() {
        var focused = this.is_focused();
        if (this.master_table && !focused) {
            focused = this.master_table.is_focused()
        }
        if (this.freezed_table && !focused) {
            focused = this.freezed_table.is_focused()
        }
        return focused;
    }
};
