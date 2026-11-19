import consts from "../consts.js";
export const columnMethods = {
    change_field_width(field_name, delta) {
        var cell_width;
        cell_width = this.get_cell_width(field_name) + delta;

        this.set_сell_width(field_name, cell_width);

        if (this.master_table) {
            this.$element.width(this.$element.width() + delta)
            this.master_table.set_сell_width(field_name, cell_width);
            this.master_table.sync_col_width();
            this.master_table.sync_freezed();
        }
        else {
            this.sync_col_width(delta > 0);
        }
        this.sync_freezed();
    },

    get_cell_width(field_name) {
        return parseInt(this.cell_widths[field_name], 10);
    },

    set_сell_width(field_name, value) {
        this.cell_widths[field_name] = value;
    },

    sync_col_width(fake_column) {
        var $row,
            field,
            $td;
        if (this.item.record_count()) {
            $row = this.$outer_table.find("tr:first-child");
            this.set_saved_width($row)
            if (this.fields.length && this.$table.is(':visible')) {
                let $tr = this.$table.find('tr:first')
                field = this.fields[this.fields.length - 1];
                $td = this.$table.find('tr:first td.' + field.field_name)
                if ($td.width() <= 0 || fake_column) {
                    this.$head.find('th.' + 'fake-column').show();
                    this.$table.find('td.' + 'fake-column').show();
                    this.set_saved_width($row, true);
                }
                else {
                    this.$head.find('th.' + 'fake-column').hide();
                    this.$table.find('td.' + 'fake-column').hide();
                }
            }
        }
    },

    get_element_width(element) {
        if (!element.length) {
            return 0;
        }
        if (element.is(':visible')) {
            return element.width()
        } else {
            return this.get_element_width(element.parent())
        }
    },

    remove_saved_width() {
        this.$outer_table.find('colgroup').remove();
        this.$table.find('colgroup').remove();
    },

    set_saved_width(row, all_cols) {
        var i,
            header_col_group = '<colgroup>',
            body_col_group = '<colgroup>',
            len = this.fields.length,
            count = len - 1,
            field,
            width,
            cell_width;
        this.remove_saved_width();
        if (this.options.multiselect) {
            header_col_group += '<col style="width: 52px">'
            body_col_group += '<col style="width: 52px">'
        }
        if (all_cols || this.master_table) {
            count = len;
        }
        for (i = 0; i < count; i++) {
            field = this.fields[i];
            width = this.get_cell_width(field.field_name);
            cell_width = width;
            if (i === 0) {
                let column_row = this.$outer_table.find("tr:first-child"),
                    column_offset = column_row.offset(),
                    cell_row = this.$table.find('tr:first'),
                    cell_offset = cell_row.offset()
                if (column_offset && cell_offset) {
                    cell_width = this.cell_widths[field.field_name]
                    cell_width = width - (Math.round(cell_offset.left + cell_width) -
                        Math.round(column_offset.left + cell_width))
                    cell_width = width - (cell_offset.left + cell_width -
                        (column_offset.left + cell_width))
                }

            }
            header_col_group += '<col style="width: ' + width + 'px">';
            body_col_group += '<col style="width: ' + cell_width + 'px">';
        }
        header_col_group += '</colgroup>';
        body_col_group += '</colgroup>';
        this.$outer_table.prepend(header_col_group)
        this.$table.prepend(body_col_group);
    }
};
