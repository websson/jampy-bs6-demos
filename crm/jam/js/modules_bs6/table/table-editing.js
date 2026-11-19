import consts from "../consts.js";
import { DBTableInput } from "../input.js";
export const editingMethods = {
    show_editor() {
        var self = this,
            width,
            height,
            min_width,
            editor,
            $div,
            $td,
            $row = this.row_by_record(),
            freezed_table = this.freezed_table;
        if ($row && this.can_edit() && !this.editing && this.selected_field && this.item.rec_count) {
            if (this.item._applying) {
                let cell = $row.find('td.' + this.selected_field.field_name);
                cell.addClass('alert-error')
                setTimeout(
                    function() {
                        cell.removeClass('alert-error');
                    },
                    1000
                );
                return;
            }
            if (!this.item.is_changing()) {
                this.item.edit();
            }
            let field = this.selected_field;
            this.edit_mode = true;
            this.editor = new DBTableInput(this, field);
            this.editor.old_data = field.data;
            this.editor.window_width = $(window).width();
            this.editor.$input.addClass('inline-editor')

            $td = $row.find('td.' + field.field_name);
            $td.find('*').hide();
            $td.css('position', 'relative')
            $td.append(this.editor.$input);
            this.editor.update();
            if (this.is_focused()) {
                this.editor.$input.focus();
            }
            this.editing = true;
        }
    },

    hide_editor() {
        var width,
            field,
            $div,
            $td;
        $td;
        if (this.editing) {
            try {
                this.edit_mode = false;
                $td = this.editor.$input.parent();
                field = this.editor.field;
                $td.find('*').show();
                this.editor.$input.remove();
                this.editor.removed = true;
                this.editor = undefined;
                $td.find('*').show();
            } finally {
                this.editing = false;
            }
            this.focus();
        }
    },

    close_editor() {
        if (this.editor) {
            let self = this,
                old_data = this.editor.old_data;
            if (!this.item.is_changing()) {
                this.item.edit();
            }
            this.flush_editor();
            this.hide_editor();
            if (this.item.is_changing()) {
                this.item.post();
            }
            this.item.apply(function(error) {
                if (error) {
                    self.selected_field.data = old_data
                    self.update_field(self.selected_field)
                    self.item.alert_error(error);
                }
                if (self.item.master) {
                    self.item.master.edit();
                }
                self.show_selection();
            });
        }
    },

    flush_editor() {
        if (this.editor && this.editing) {
            this.editor.change_field_text();
        }
    },

    can_edit() {
        if (this.item.read_only) {
            return false;
        }
        return this.options.editable;
     },

    do_on_edit(field) {
        if (this.item.lookup_field) {
            this.item.set_lookup_field_value();
        } else {
            if (this.can_edit()) {
                if (field) {
                    this.set_selected_field(field);
                }
                if (!this.edit_mode && (!field || this.editable_fields.indexOf(field) !== -1)) {
                    this.show_editor();
                }
            }
            if (!this.edit_mode) {
                if (this.on_dblclick) {
                    this.on_dblclick.call(this.item, this.item);
                } else if (this.options.dblclick_edit) {
                    this.item.edit_record();
                }
            }
        }
    }
};
