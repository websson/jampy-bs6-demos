import consts from "../consts.js";
export const paginationMethods = {
    update_page_info(page) {
        var cur_page;
        if (page === undefined) {
            cur_page = this.page;
        }
        else {
            cur_page = page
        }
        if (this.options.show_paginator) {
            if (this.$pageInput) {
                this.$pageInput.val(cur_page + 1);
                if (this.page === 0) {
                    this.$fistPageBtn.addClass("disabled");
                    this.$priorPageBtn.addClass("disabled");
                } else {
                    this.$fistPageBtn.removeClass("disabled");
                    this.$priorPageBtn.removeClass("disabled");
                }
                if (this.item.is_loaded) {
                    this.$lastPageBtn.addClass("disabled");
                    this.$nextPageBtn.addClass("disabled");
                } else {
                    this.$lastPageBtn.removeClass("disabled");
                    this.$nextPageBtn.removeClass("disabled");
                }
            }
        }
        if (this.$page_number) {
            this.$page_number.text(cur_page + 1 + ' ');
        }

        if (this.options.on_page_changed && page === undefined) {
            this.options.on_page_changed.call(this.item, this.item, this);
        }
    },

    update_totals(callback) {
        var self = this;
        this.calc_summary(function(count) {
            self.update_page_count(count);
            if (callback) {
                callback();
            }
        })
    },

    update_page_count(count) {
        if (this.item._paginate && self.record_count !== count) {
            this.record_count = count;
            this.$scroll_div.height(this.scroll_height())
            this.page_count = Math.ceil(count / this.row_count);
            if (this.$page_count) {
                this.$page_count.text('1');
                if (this.page_count) {
                    this.$page_count.text(this.page_count);
                }
            }
            if (this.options.on_pagecount_update) {
                this.options.on_pagecount_update.call(this.item, this.item, this);
            }
            if (this.options.on_page_changed) {
                this.options.on_page_changed.call(this.item, this.item, this);
            }
        }
    },

    set_page_number(value, callback, chech_last_page) {
        var self = this;

        if (chech_last_page === undefined) {
            chech_last_page = true;
        }
        if (!this.item._paginate || this.loading) {
            return;
        }
        if (value < this.page_count || value === 0) {
            this.page = value;
            this.scrollLeft = this.$element.find('.table-container').get(0).scrollLeft;
            if (this.master_table) {
                this.master_table.scrollLeft = this.master_table.$element.find('.table-container').get(0).scrollLeft;
            }
            this.loading = true;
            if (this.item.record_count()) {
                this.item._do_before_scroll();
            }
            this.item._page_changed = true;
            this.item.open({offset: this.page * this.item._limit}, function() {
                self.item._page_changed = false;
                if (callback) {
                    callback.call(self);
                }
                self.loading = false;
                self.update_page_info();
                self.$element.find('.table-container').get(0).scrollLeft = self.scrollLeft;
                if (self.master_table) {
                    self.master_table.$element.find('.table-container').get(0).scrollLeft = self.master_table.scrollLeft;
                }
                if (value === this.page_count - 1 && self.item.rec_count === 0 && chech_last_page) {
                    self.update_totals(function() {
                        self.set_page_number(self.page_count - 1, callback, false)
                    })
                }
                else if (callback) {
                    callback.call(this);
                }
            });
        }
    },

    reload(callback) {
        if (this.item._paginate) {
            this.set_page_number(this.page, callback);
        } else {
            this.open(callback);
        }
    },

    calc_summary(callback) {
        var self = this,
            i,
            copy,
            field_name,
            field,
            fields,
            count_field,
            sum_fields,
            count_fields,
            total_records = 0,
            funcs,
            params = {};

        if (!this.item._paginate || this.item.virtual_table) {
            this.item.calc_summary(this.item, undefined, undefined, this.options.summary_fields);
        }
        else {
            if (this.item.master) {
                copy = task.item_by_ID(this.item.prototype_ID).copy({handlers: false, details: false});
            }
            else {
                copy = this.item.copy({handlers: false, details: false});
            }

            count_field = copy._primary_key;
            fields = [];
            count_fields = [];
            sum_fields = [];
            funcs = {};

            // always request row count via COUNT(pk)
            sum_fields.push(count_field);
            funcs[count_field] = 'count';

            // set up aggregation funcs
            for (i = 0; i < this.options.summary_fields.length; i++) {
                field_name = this.options.summary_fields[i];
                field = this.item.field_by_name(field_name);
                if (field && this.fields.indexOf(field) !== -1) {
                    fields.push(field_name);
                    if (field.data_type === consts.BOOLEAN) {
                        sum_fields.push(field_name);
                        funcs[field_name] = 'sum'; // TRUE count
                    }
                    else if (field.numeric_field()) {
                        sum_fields.push(field_name);
                        funcs[field_name] = 'sum';
                    }
                    else {
                        count_fields.push(field_name);
                    }
                }
            }

            // copy params
            for (var key in self.item._open_params) {
                if (self.item._open_params.hasOwnProperty(key)) {
                    if (key.substring(0, 2) !== '__') {
                        params[key] = self.item._open_params[key];
                    }
                }
            }
            params.__summary = true;
            if (self.item._open_params.__filters) {
                copy._where_list = self.item._open_params.__filters;
            }
            if (this.item.master) {
                copy.ID = this.item.ID;
                params.__master_id = this.item.master.ID;
                params.__master_rec_id = this.item.master.field_by_name(this.item.master._primary_key).value;
            }

            this.item._fields_summary_info = {};
            copy.open({fields: sum_fields, funcs: funcs, params: params}, function() {

                var counts = {};

                // collect all values
                copy.each_field(function(f) {
                    counts[f.field_name] = f.value;
                });

                // get total row count safely from COUNT(pk)
                total_records = counts[count_field] || 0;

                // now build summaries
                copy.each_field(function(f) {
                    if (f.field_name === count_field) {
                        total_records = f.data; // COUNT(*)
                    }
                    else if (f.data_type === consts.BOOLEAN) {
                        var true_count = f.data || 0;           // f.data has SUM(PAID)
                        var false_count = total_records - true_count;
                        self.item._fields_summary_info[f.field_name] = {
                            text: true_count + ' ✓ / ' + false_count + ' ✗',
                            value: true_count
                        };
                    }
                    else if (f.numeric_field()) {
                        self.item._fields_summary_info[f.field_name] = {
                            text: f.display_text,
                            value: f.value
                        };
                    }
                });

                // non-numeric, non-boolean fields → show row count
                for (i = 0; i < count_fields.length; i++) {
                    self.item._fields_summary_info[count_fields[i]] = {
                        text: total_records + '',
                        value: total_records
                    };
                }

                self.update_summary();
                if (callback) {
                    callback.call(this, total_records);
                }
            });
        }
    }
};
