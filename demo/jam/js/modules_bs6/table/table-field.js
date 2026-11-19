import { highlight } from "../input.js";
import consts from "../consts.js";
export const fieldMethods = {
    get_field_text(field) {
        if (field.lookup_data_type === consts.BOOLEAN) {
            let res;
            if (field.owner && (field.owner.on_field_get_text || field.owner.on_get_field_text)) {
                if (field.owner.on_field_get_text) {
                    res = field.owner.on_field_get_text.call(field.owner, field);
                }
                else if (field.owner.on_get_field_text) {
                    res = field.owner.on_get_field_text.call(field.owner, field);
                }
            }
            if (!res) {
                return field.lookup_value ? '×' : ''
            }
        }
        return field.sanitized_text;
    },

    get_field_html(field) {
        var result;
        result = field.get_html();
        if (!result) {
            result = this.get_field_text(field);
            if (field._owner_is_item() && this.item._open_params.__search) {
                if (field.field_name === this.item._open_params.__search[0]) {
                    var text = this.item._open_params.__search[1];
                    if (this.item._open_params.__search.length === 4) {
                        text = this.item._open_params.__search[3];
                    }
                    result = highlight(result, text);
                }
            }
        }
        return result;
    },

    update_field(field, refreshingRow) {
        var self = this,
            row = this.row_by_record(),
            update,
            build,
            html,
            div;
        if (row && this.item.active && this.item.controls_enabled() && this.item.record_count()) {
            div = row.find('div.' + field.field_name);
            if (div.length) {
                html = this.get_field_html(field)
                if (html !== div.html()) {
                    div.html(html);
                    if (this.item.record_count() < 3 && (!this.item.paginate || this.item.paginate && this.page_count === 0)) {
                        this.build();
                    }
                    if (!refreshingRow) {
                        this.update_selected(row);
                    }
                }
            }
        }
    },

    each_field(callback) {
        var i = 0,
            len = this.fields.length,
            value;
        for (; i < len; i++) {
            value = callback.call(this.fields[i], this.fields[i], i);
            if (value === false) {
                break;
            }
        }
    },

    get_freezed_fields(len) {
        var i,
            result = [];
        if (!len) {
            len = this.options.freeze_count;
        }
        for (i = 0; i < len; i++) {
            result.push(this.fields[i].field_name);
        }
        return result;
     },

    set_selected_field(field) {
        var self = this,
            field_changed = this.selected_field !== field;
        if (field_changed && this.can_edit()) {
            this.close_editor();
        }
        if (this.editable_fields.indexOf(field) !== -1) {
            this.hide_selection();
            this.selected_field = field
            this.show_selection();
        }
    },

    next_field() {
        var index;
        if (this.selected_field) {
            index = this.editable_fields.indexOf(this.selected_field);
            if (index < this.editable_fields.length - 1) {
                this.set_selected_field(this.editable_fields[index + 1]);
            }
            else {
                if (this.master_table && this.master_table.editable_fields.length) {
                    this.master_table.set_selected_field(this.master_table.editable_fields[0]);
                    this.master_table.focus();
                }
            }
        }
    },

    prior_field() {
        var index;
        if (this.selected_field) {
            index = this.editable_fields.indexOf(this.selected_field);
            if (index > 0) {
                this.set_selected_field(this.editable_fields[index - 1]);
            }
            else {
                if (this.freezed_table && this.freezed_table.editable_fields.length) {
                    this.freezed_table.set_selected_field(this.freezed_table.editable_fields[0]);
                    this.freezed_table.focus();
                }
            }
        }
    }
};
