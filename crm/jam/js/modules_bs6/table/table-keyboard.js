import consts from "../consts.js";
export const keyboardMethods = {
    keydown(e) {
        if (window._jam_command_palette_open || window._jam_command_palette_closing) {
            return;
        }
        this.scroll_delta = 0;
        var self = this,
            code = (e.keyCode ? e.keyCode : e.which);
        if (!e.ctrlKey && !e.shiftKey) {
            switch (code) {
                case 33:
                case 34:
                case 35:
                case 36:
                case 38:
                case 40:
                    if (this.editing && code !== 38 && code !== 40) {
                        return
                    }
                    e.preventDefault();
                    this.close_editor();
                    if (code === 33) {
                        this.prior_page();
                    } else if (code === 34) {
                        if (this.item._paginate && this.item.is_loaded) {
                            this.item.last();
                        } else {
                            this.next_page();
                        }
                    } else if (code === 38) {
                        this.prior_record();
                    } else if (code === 40) {
                        this.next_record();
                    } else if (code === 36) {
                        this.first_page();
                    } else if (code === 35) {
                        this.last_page();
                    }
                    break;
                case 37:
                    if (this.can_edit() && !this.edit_mode) {
                        this.prior_field();
                    }
                    break;
                case 39:
                    if (this.can_edit() && !this.edit_mode) {
                        this.next_field();
                    }
                    break;
            }
        }
    },

    keyup(e) {
        if (window._jam_command_palette_open || window._jam_command_palette_closing) {
            return;
        }
        var self = this,
            multi_sel,
            code = (e.keyCode ? e.keyCode : e.which);
        if (e.target === this.$table.get(0) && !e.ctrlKey && !e.shiftKey) {
            switch (code) {
                case 13:
                    e.preventDefault();
                    this.do_on_edit();
                    break;
                case 33:
                case 34:
                case 35:
                case 36:
                case 38:
                case 40:
                    e.preventDefault();
                    break;
                case 32:
                    e.preventDefault();
                    if (this.options.multiselect) {
                        multi_sel = this.row_by_record().find('input.multi-select');
                        this.selections_set_selected(!multi_sel[0].checked);
                        multi_sel.prop('checked', this.selections_get_selected());
                    }
                    break
            }
        }
    },

    keypress(e) {
        if (window._jam_command_palette_open || window._jam_command_palette_closing) {
            return;
        }
        var self = this,
            multi_sel,
            code = e.which;
        if (code > 32 && this.can_edit() && this.options.keypress_edit && !this.edit_mode) {
            if (this.selected_field && this.selected_field.valid_char_code(code)) {
                this.show_editor();
            }
        }
    }
};
