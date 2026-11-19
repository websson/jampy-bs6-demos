import consts from "../consts.js";
export const navigationMethods = {
    next_record(btn_click) {
        this.cancel_sync();
        try {
            this.item.next();
            if (this.item.eof()) {
                if (this.can_edit() && this.options.append_on_lastrow_keydown) {
                    this.item.append();
                } else if (this.item.paginate) {
                    let page_scroll = btn_click || this.options.auto_page_scroll;
                    if (page_scroll) {
                        this.next_page();
                    }
                }
            }
            else if (!this.item.paginate) {
                this.show_next_record();
                if (this.master_table) {
                    this.master_table.show_next_record()
                }
                if (this.freezed_table) {
                    this.freezed_table.show_next_record()
                }
            }
        }
        finally {
            this.resume_sync();
        }
        this.syncronize_tables();
    },

    prior_record(btn_click) {
        var self = this;
        this.cancel_sync();
        try {
            this.item.prior();
            if (this.item.bof()) {
                if (this.item.paginate) {
                    let page_scroll = btn_click || this.options.auto_page_scroll;
                    if (page_scroll) {
                        this.prior_page(function() {
                            self.item.last();
                        });
                    }
                }
            }
            else if (!this.item.paginate) {
                this.show_prior_record();
                if (this.master_table) {
                    this.master_table.show_prior_record();
                }
                if (this.freezed_table) {
                    this.freezed_table.show_prior_record();
                }
            }
        }
        finally {
            this.resume_sync();
        }
        this.syncronize_tables();
    },

    show_next_record() {
        var self = this,
            row = this.row_by_record();
        if (!row) {
            row = this.datasource[0][1];
            row.remove();
            this.datasource.splice(0, 1);
            row = $(this.new_row());
            if (this.options.row_callback) {
                this.options.row_callback(row, this.item);
            }
            this.$table.append(row);
            this.datasource.push([this.item.rec_no, row[0]]);
            this.update_ellipse_btn(row);
        }

    },

    show_prior_record() {
        var row = this.row_by_record(),
            index;
        if (!row) {
            if (this.datasource.length === this.row_count) {
                index = this.datasource.length - 1;
                row = this.datasource[index][1];
                row.remove();
                this.datasource.splice(index, 1);
                row = $(this.new_row());
                if (this.options.row_callback) {
                    this.options.row_callback(row, this.item);
                }
                this.$table.prepend(row);
                this.datasource.splice(0, 0, [this.item.rec_no, row[0]]);
                this.update_ellipse_btn(row);
            }
        }
    },

    first_page() {
        let args = this.item._check_args(arguments),
            callback = args['function'],
            btn_click = args['boolean'],
            page_scroll = btn_click || this.options.auto_page_scroll;
        if (this.item._paginate && page_scroll) {
            this.set_page_number(0, callback);
        } else {
            this.item.first();
            this.syncronize_tables();
        }
    },

    next_page() {
        let args = this.item._check_args(arguments),
            callback = args['function'],
            btn_click = args['boolean'];
        if (this.item._paginate) {
            let page_scroll = btn_click || this.options.auto_page_scroll
            if (!this.item.is_loaded && page_scroll) {
                this.set_page_number(this.page + 1, callback);
            }
        } else {
            let clone = this.item.clone();
            clone.rec_no = this.item.rec_no;
            for (var i = 0; i < this.row_count; i++) {
                if (!clone.eof()) {
                    clone.next();
                } else {
                    break;
                }
            }
            this.item.rec_no = clone.rec_no;
            this.syncronize_tables();
        }
    },

    prior_page() {
        let args = this.item._check_args(arguments),
            callback = args['function'],
            btn_click = args['boolean'];
        if (this.item._paginate) {
            if (this.page > 0) {
                let page_scroll = btn_click || this.options.auto_page_scroll
                if (page_scroll) {
                    this.set_page_number(this.page - 1, callback);
                }
            } else {
                this.syncronize();
            }
        } else {
            let clone = this.item.clone();
            clone.rec_no = this.item.rec_no;
            for (var i = 0; i < this.row_count; i++) {
                if (!clone.eof()) {
                    clone.prior();
                } else {
                    break;
                }
            }
            this.item.rec_no = clone.rec_no;
            this.syncronize_tables();
        }
    },

    last_page() {
        let args = this.item._check_args(arguments),
            callback = args['function'],
            btn_click = args['boolean'],
            page_scroll = btn_click || this.options.auto_page_scroll;
        var self = this;
        if (this.item._paginate && page_scroll) {
            this.set_page_number(this.page_count - 1, callback);
        } else {
            this.item.last();
            this.syncronize_tables();
        }
    }
};
