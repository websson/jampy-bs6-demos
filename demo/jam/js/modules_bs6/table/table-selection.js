import consts from "../consts.js";
export const selectionMethods = {
    show_selection() {
        if (!this.is_showing_selection) {
            this.is_showing_selection = true;
            try {
                this.selected_row.addClass('row-selected');
                if (this.table_focused()) {
                    this.selected_row.addClass('table-focused');
                }
                if (this.selected_row) {
                    if (this.can_edit() && this.selected_field) {
                        this.selected_row.find('td.' + this.selected_field.field_name)
                            .addClass("field-selected");
                    }
                }
                if (this.master_table) {
                    this.master_table.show_selection()
                }
                if (this.freezed_table) {
                    this.freezed_table.show_selection()
                }
            }
            finally {
                this.is_showing_selection = false;
            }
        }
    },

    hide_selection() {
        if (this.selected_row) {
            this.selected_row.removeClass("row-selected table-focused");
            if (this.selected_field) {
                this.selected_row.find('td.' + this.selected_field.field_name)
                    .removeClass("field-selected")
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
    },

    select_row($row) {
        var divs,
            textHeight = this.text_height;
        this.hide_selection();
        if (this.options.row_line_count && this.selected_row && this.options.expand_selected_row) {
            divs = this.selected_row.find('tr, div')
            divs.css('height', this.options.row_line_count * textHeight);
            this.update_ellipse_btn(this.selected_row);
        }
        this.selected_row = $row;
        this.show_selection();
        if (this.options.row_line_count && this.options.expand_selected_row) {
            divs = this.selected_row.find('tr, div')
            divs.css('height', '');
            divs.css('height', this.options.expand_selected_row * textHeight);
            this.update_ellipse_btn(this.selected_row);
        }
    },

    selections_update_selected() {
        var sel_count = this.$element.find('th .multi-select .sel-count');
        if (this.options.multiselect) {
            sel_count.text(this.item.selections.length);
            if (this.item._show_selected) {
                sel_count.addClass('selected-shown')
            }
            else {
                sel_count.removeClass('selected-shown')
            }
            if (this.item.lookup_field && this.item.lookup_field.multi_select) {
                if (this.item.rec_count && this.item.selections.length === 1 &&
                    this.item._primary_key_field && this.item.selections.indexOf(this.item._primary_key_field.value) !== -1) {
                    var l_field = this.item.lookup_field.lookup_field ? this.item.field_by_name(this.item.lookup_field.lookup_field) : null;
                    var d_text = l_field ? l_field.display_text : (this.item._display_field ? this.item._display_field.display_text : '');
                    this.item.lookup_field.set_value(this.item.selections, d_text);
                }
                else {
                    this.item.lookup_field.set_value(this.item.selections, '');
                }
            }
        }
     },

    selections_get_selected() {
        return this.item.selections.indexOf(this.item._primary_key_field.value) !== -1;
     },

    selections_can_change(value) {
        var valid = true;
        if (value && this.options.selection_limit) {
            valid = (this.options.selection_limit &&
                this.options.selection_limit >= this.item.selections.length + 1);
            if (!valid) {
                this.item.warning(task.language.selection_limit_exceeded.replace('%s', this.options.selection_limit))
            }
        }
        return valid;
     },

    selections_set_selected(value) {
        var self = this,
            result = value,
            index,
            clone,
            selected = false;
        if (this.selections_can_change(value)) {
            if (value) {
                this.item.selections.add(this.item._primary_key_field.value);
                selected = true;
            } else {
                this.item.selections.remove(this.item._primary_key_field.value)
                clone = this.item.clone();
                clone.each(function(c) {
                    if (self.item.selections.indexOf(c._primary_key_field.value) !== -1) {
                        selected = true;
                        return false;
                    }
                })
            }
            this.selections_update_selected();
            this.$element.find('input.multi-select-checkbox').prop('checked', selected);
        }
        else {
            result = false;
        }
        return result;
     },

    selections_get_all_selected() {
        var self = this,
            clone = this.item.clone(),
            result = false;
        clone.each(function(c) {
            if (self.item.selections.indexOf(c._primary_key_field.value) !== -1) {
                result = true;
                return false;
            }
        })
        return result;
     },

    selections_set_all_selected_ex(value) {
        var self = this,
            i,
            field,
            fields = [],
            limit,
            exceeded,
            mess,
            copy,
            clone;
        if (this.options.select_all) {
            copy = this.item.copy({handlers: false})
            copy._where_list = this.item._open_params.__filters;
            copy._order_by_list = this.item._open_params.__order;
            if (this.options.selection_limit) {
                limit = this.options.selection_limit;// - this.item.selections.length;
            }
            fields.push(copy._primary_key);
            for (i = 0; i < copy._where_list.length; i++) {
                field = this.item.field_by_name(copy._where_list[i][0]);
                if (field.lookup_item) {
                    fields.push(field.field_name);
                }
            }
            for (i = 0; i < copy._order_by_list.length; i++) {
                field = this.item.field_by_name(copy._order_by_list[i][0]);
                if (fields.indexOf(field.field_name) === -1) {
                    fields.push(field.field_name);
                }
            }
            copy.open({fields: fields, limit: limit}, function() {
                let dict = {};
                if (value) {
                    for (i = 0; i < self.item.selections.length; i++) {
                        dict[self.item.selections[i]] = true;
                    }
                    copy.each(function(c) {
                        if (!dict[c._primary_key_field.value]) {
                            self.item.selections.add(c._primary_key_field.value);
                        }
                    });
                }
                else {
                    copy.each(function(c) {
                        dict[c._primary_key_field.value] = true;
                    });
                    let selections = []
                    for (i = 0; i < self.item.selections.length; i++) {
                        let sel = self.item.selections[i];
                        if (!dict[sel]) {
                            selections.push(sel);
                        }
                    }
                    self.item.selections = selections;
                }
                self.$table.find('td input.multi-select').prop('checked', value);
                self.$element.find('input.multi-select-header').prop('checked',
                    self.selections_get_all_selected());
                self.selections_update_selected();
            })
        }
     },

    selections_set_all_selected(value) {
        var self = this,
            i,
            field,
            fields = [],
            limit,
            exceeded,
            mess,
            copy,
            clone;
        clone = this.item.clone();
        clone.each(function(c) {
            var index;
            if (self.selections_can_change(value)) {
                if (value) {
                    self.item.selections.add(c._primary_key_field.value);
                } else {
                    self.item.selections.remove(c._primary_key_field.value);
                }
            }
            else {
                exceeded = true;
                return false;
            }
        })
        if (exceeded) {
            this.build();
        }
        else {
            self.$table.find('td input.multi-select').prop('checked', value);
        }
        this.selections_update_selected();
     }
};
