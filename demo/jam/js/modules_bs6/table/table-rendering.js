import consts from "../consts.js";
export const renderingMethods = {
    fill_title($element) {
        var i,
            self = this,
            field,
            caption,
            heading,
            div,
            cell,
            input,
            bl,
            checked = '',
            field_name,
            sel_count,
            desc,
            order_fields = {},
            sortable_fields = {},
            shown_title,
            select_menu = '';
        if ($element === undefined) {
            $element = this.$element
        }
        if (!this._sorted_fields) {
            this._sorted_fields = [];
        }
        for (i = 0; i < this.fields.length; i++) {
            if (this.options.sortable) {
                field = this.fields[i];
                if (!this.options.sort_fields.length || this.options.sort_fields.indexOf(field.field_name) !== -1) {
                    sortable_fields[field.field_name] = '<span style="font-size: xx-small;">&varr;</span>';
                }
            }
        }
        for (i = 0; i < this._sorted_fields.length; i++) {
            try {
                desc = this._sorted_fields[i][1];
                field = this.item.field_by_name(this._sorted_fields[i][0])
                if (desc) {
                    order_fields[field.field_name] = '<span>&darr;</span>';
                } else {
                    order_fields[field.field_name] = '<span>&uarr;</span>';
                }
            } catch (e) {}
        }

        heading = $element.find("thead tr:first");
        heading.empty();
        if (this.options.multiselect) {
            if (this.item.master || !this.item._paginate) {
                if (this.selections_get_all_selected()) {
                    checked = 'checked';
                }
                div = $('<div class="text-center multi-select" style="overflow: hidden"></div>');
                sel_count = $('<p class="sel-count text-center">' + this.item.selections.length + '</p>')
                div.append(sel_count);
                input = $('<input class="multi-select-checkbox" type="checkbox" ' + checked + ' tabindex="-1">');
                div.append(input);
                cell = $('<th class="multi-select-checkbox"></th>').append(div);
                heading.append(cell);
            }
            else {
                if (this.selections_get_all_selected()) {
                    checked = 'checked';
                }
                div = $('<div class="text-center multi-select" style="overflow: hidden"></div>');
                sel_count = $('<p class="sel-count text-center">' + this.item.selections.length + '</p>')
                div.append(sel_count);
                if (this.options.select_all) {
                    select_menu +=
                        '<li><button type="button" class="menu-item select-all" tabindex="-1">' + task.language.select_all + '</button></li>' +
                        '<li><button type="button" class="menu-item unselect-all" tabindex="-1">' + task.language.unselect_all + '</button></li>';
                }
                shown_title = task.language.show_selected;
                if (self.item._show_selected) {
                    shown_title = task.language.show_all;
                }
                select_menu +=
                    '<li><button type="button" class="menu-item show-selected" tabindex="-1">' + shown_title + '</button></li>';
                bl = $(
                        '<div class="btn-group select-block" style="position: relative">' +
                            '<button type="button" class="btn mselect-btn" tabindex="-1">' +
                                '<input class="multi-select-checkbox" type="checkbox" tabindex="-1"' + checked + '>' +
                            '</button>' +
                            '<button class="btn btn-outline-secondary select-menu-btn" type="button" data-bs-toggle="menu" aria-expanded="false">' +
                                '<i class="bi bi-caret-down-fill" style="font-size: 0.65rem;"></i>' +
                            '</button>' +
                            '<ul class="menu">' +
                                select_menu +
                            '</ul>' +
                        '</div>'
                );

                // BS6 Menu click handling
                bl.find('.select-menu-btn').on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.bootstrap && bootstrap.Menu) {
                        let menuInstance = bootstrap.Menu.getInstance(this);
                        if (!menuInstance) {
                            menuInstance = new bootstrap.Menu(this);
                        }
                        menuInstance.toggle();
                    }
                });

                input = bl.find('.mselect-block');
                bl.find(".select-all").click(function(e) {
                    e.preventDefault();
                    if (window.bootstrap && bootstrap.Menu) {
                        let menuInstance = bootstrap.Menu.getInstance(bl.find('.select-menu-btn')[0]);
                        if (menuInstance) {
                            menuInstance.hide();
                        }
                    }
                    self.selections_set_all_selected_ex(true);
                    self.$table.focus();
                });
                bl.find(".unselect-all").click(function(e) {
                    e.preventDefault();
                    if (window.bootstrap && bootstrap.Menu) {
                        let menuInstance = bootstrap.Menu.getInstance(bl.find('.select-menu-btn')[0]);
                        if (menuInstance) {
                            menuInstance.hide();
                        }
                    }
                    self.selections_set_all_selected_ex(false);
                    self.$table.focus();
                });
                bl.find(".show-selected").click(function(e) {
                    e.preventDefault();
                    if (window.bootstrap && bootstrap.Menu) {
                        let menuInstance = bootstrap.Menu.getInstance(bl.find('.select-menu-btn')[0]);
                        if (menuInstance) {
                            menuInstance.hide();
                        }
                    }
                    self.item._show_selected = !self.item._show_selected;
                    self.item._reopen(0, {__show_selected_changed: true}, function() {
                        self.selections_update_selected();
                        self.$table.focus();
                    });
                });
                cell = $('<th class="multi-select"></th>').append(div);
                heading.append(cell);
                //~ cell.css('padding-top', 0);
                //~ input.css('top', sel_count.outerHeight() + sel_count.position().top + 4);
                //~ input.css('left', (cell.outerWidth() - input.width()) / 2 + 1);
                cell.append(bl);
            }
        }
        for (i = 0; i < this.fields.length; i++) {
            field = this.fields[i];
            caption = field.field_caption;
            if (order_fields[field.field_name]) {
                caption = order_fields[field.field_name] + caption;
            }
            else if (sortable_fields[field.field_name]) {
                caption = sortable_fields[field.field_name] + caption;
            }
            div = $('<div class="th-container"><div class="th-table"><div class="text-center th-text ' + field.field_name +
                '" style="overflow: hidden">' + caption + '</div></div></div>');
            cell = $('<th class="' + field.field_name + '" data-field_name="' + field.field_name + '" style="vertical-align: middle"></th>').append(div);
            heading.append(cell);
            if (this.options.title_line_count !== 0) {
                div.css('height', parseInt(cell.css('line-height'), 10) * this.options.title_line_count);
                cell.css('height', parseInt(cell.css('line-height'), 10) * this.options.title_line_count);
            }
        }
        heading.append('<th class="fake-column" style="display: None;></th>');
        if (this.options.title_callback) {
            this.options.title_callback(heading, this.item)
        }
        this.selections_update_selected();
    },

    fill_footer($element) {
        var i,
            len,
            field,
            footer,
            old_footer,
            div,
            old_div,
            cell,
            cell_width;
        if ($element === undefined) {
            $element = this.$element
        }
        footer = $element.find("tfoot tr:first");
        old_footer = footer.clone();
        footer.empty();
        if (this.options.multiselect) {
            div = $('<div class="text-center multi-select" style="overflow: hidden; width: 100%"></div>')
            cell = $('<th class="multi-select"></th>').append(div);
            footer.append(cell);
        }
        len = this.fields.length;
        for (i = 0; i < len; i++) {
            field = this.fields[i];
            div = $('<div class="text-center ' + field.field_name +
                '" style="overflow: hidden; width: 100%">&nbsp</div>');
            old_div = old_footer.find('div.' + field.field_name)
            if (old_div.length) {
                div.html(old_div.html());
            }
            cell = $('<th class="' + field.field_name + '"></th>').append(div);
            footer.append(cell);
        }
        footer.append('<th class="fake-column" style="display: None;></th>');
        if (!this.options.show_footer) {
            footer.hide();
        }
    },

    fill_datasource(start_rec, add_rec) {
        var self = this,
            counter = 0,
            clone = this.item.clone(true);
        if (!this.datasource.length || this.item.paginate) {
            this.datasource = [];
            if (start_rec === undefined) {
                start_rec = 0;
            }
            if (add_rec == undefined) {
                add_rec = 0
            }
            clone.rec_no = start_rec;
            while (!clone.eof()) {
                self.datasource.push([clone.rec_no, null]);
                clone.next();
                counter += 1;
                if (counter >= self.row_count + add_rec) {
                    break;
                }
            }
        }
    },

    fill_rows() {
        var i,
            len,
            row,
            rows,
            rec,
            item_rec_no;
        rows = ''
        item_rec_no = this.item.rec_no;
        try {
            len = this.datasource.length;
            for (i = 0; i < len; i++) {
                this.item._cur_row = this.datasource[i][0];
                row = this.new_row();
                rows += row;
            }
            this.$table.html(rows);
            rows = this.$table.find("tr");
            for (i = 0; i < len; i++) {
                this.datasource[i][1] = rows[i];
                if (this.options.row_callback) {
                    this.item._cur_row = this.datasource[i][0];
                    this.options.row_callback($(rows[i]), this.item);
                }
            }
        } finally {
            this.item._cur_row = item_rec_no;
        }
    },

    new_row() {
        var i,
            len,
            rowStr,
            checked = '';
        len = this.fields.length;
        rowStr = '';
        if (this.options.multiselect) {
            if (this.selections_get_selected()) {
                checked = 'checked';
            }
            rowStr += this.new_column('multi-select',
                'center', '<input class="multi-select" type="checkbox" ' + checked +
                ' tabindex="-1" style="margin: 0">', -1, '');
        }
        for (i = 0; i < len; i++) {
            let field = this.fields[i],
                text = this.get_field_html(field),
                align = field.data_type === consts.BOOLEAN ? 'center' : consts.align_value[field.alignment],
                field_type = consts.field_type_names[field.lookup_data_type] + '-displayed';
            rowStr += this.new_column(field.field_name, align, text, i, field_type);
        }
        rowStr += '<td class="fake-column" style="display: None;"></td>'
        return '<tr class="inner">' + rowStr + '</tr>';
    },

    new_column(columnName, align, text, index, field_type) {
        var cell_width = this.get_cell_width(columnName),
            classStr = 'class="' + columnName + ' ' + field_type,
            dataStr = 'data-field_name="' + columnName + '"',
            tdStyleStr = 'style="text-align:' + align + ';overflow: hidden',
            divStyleStr = 'style="overflow: hidden !important';
        if (this.text_height) {
            if (this.options.row_line_count) {
                divStyleStr += '; height: ' + this.options.row_line_count * this.text_height + 'px; width: auto';
            }
        }
        classStr += '""';
        tdStyleStr += '""';
        divStyleStr += '"';
        return '<td ' + classStr + ' ' + dataStr + ' ' + tdStyleStr + '>' +
            '<div ' + classStr + ' ' + divStyleStr + '>' + text +
            '</div>' +
            '</td>';
    },

    refresh() {
        var i,
            len,
            field,
            row, tmpRow,
            cell,
            cell_width,
            headCell,
            footCell,
            table,
            rows,
            title = '',
            rec,
            item_rec_no,
            rec_nos = [],
            info,
            is_focused,
            is_visible = this.$table.is(':visible'),
            scroll_left = this.$table_container.scrollLeft(),
            editable_val,
            container,
            search_form = this.$outer_table.find('thead th > form.title-search-input-form'),
            search_field_name,
            search_input_focused,
            self = this;
        is_focused = this.is_focused();
        if (search_form.length === 1) {
            search_field_name = search_form.parent().data('field_name');
            search_input_focused = search_form.find('input').is(":focus");
            search_form.hide();
            search_form.detach();
        }
        else {
            search_form = undefined;
            this.hide_search_inputs();
        }
        if (this.options.editable && this.edit_mode && this.editor) {
            if (!is_focused) {
                is_focused = this.editor.$input.is(':focus');
            }
            editable_val = this.editor.$input.value;
            this.hide_editor();
        }

        if (!this.item.paginate) {
            if (this.options.row_count !== this.row_count) {
                this.calc_overlay_div_height();
            }
            this.$scroll_div.height(this.scroll_height());
        }
        this.$table.empty();
        if (this.selection_block) {
            this.selection_block.remove();
        }
        this.$outer_table.find('#top-td').attr('colspan', this.colspan);

        this.fill_datasource();
        this.fill_rows();

        row = this.$table.find("tr:first");
        if (!this.field_width_updated) {
            container = $('<div>');
            container.css("position", "absolute")
                //~ .css("top", 0)
                .css("top", -1000)
                .width(this.get_element_width(this.$element));
            $('body').append(container);
            this.$element.detach();
            container.append(this.$element);

            this.$table.css('table-layout', 'auto');
            this.$outer_table.css('table-layout', 'auto');
            tmpRow = '<tr>'
            if (this.options.multiselect) {
                tmpRow = tmpRow + '<th class="multi-select">' +
                    '<div class="text-center multi-select" style="overflow: hidden"></div>' +
                    '</th>';
            }
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                tmpRow = tmpRow + '<th class="' + this.fields[i].field_name + '" ><div style="overflow: hidden">' +
                    '<span style="font-size: xx-small;">&darr;</span>' + this.fields[i].field_caption + '</div></th>';
            }
            tmpRow = $(tmpRow + '</tr>');
            this.$table.prepend(tmpRow);
            for (var field_name in this.options.column_width) {
                if (this.options.column_width.hasOwnProperty(field_name)) {
                    tmpRow.find("." + field_name).css("width", this.options.column_width[field_name]);
                }
            }
            for (i = 0; i < len; i++) {
                field = this.fields[i];
                cell = row.find("td." + field.field_name);
                this.set_сell_width(field.field_name, cell.outerWidth());
            }

            tmpRow.remove();

            this.$element.detach();
            this.$container.append(this.$element);

            container.remove();

            this.$table.css('table-layout', 'fixed');
            this.$outer_table.css('table-layout', 'fixed');


            this.fill_title(this.$element);
            this.fill_footer(this.$element);
            this.set_saved_width();
            if (this.item.record_count() > 0 && is_visible) {
                this.field_width_updated = true;
            }
        } else {
            this.fill_title(this.$element);
            this.fill_footer(this.$element);
        }

        if (this.options.show_footer) {
            this.$foot.show();
        }
        this.$container.find('tfoot .pager').attr('colspan', this.colspan);

        this.syncronize();
        if (is_focused) {
            this.focus();
        }
        if (this.can_edit() && this.edit_mode && this.editor) {
            this.show_editor();
            this.editor.$input.value = editable_val;
        }
        this.update_summary();
        this.sync_col_width();
        this.$table_container.scrollLeft(scroll_left);
        if (!this.item.rec_count) {
            this.$head.find('th')
                .css('borderBottomWidth', this.$outer_table.css('borderTopWidth'))
                .css('borderBottomStyle', this.$outer_table.css('borderTopStyle'))
                .css('borderBottomColor', this.$outer_table.css('borderTopColor'));
        }
        if (search_form && search_form.length) {
            let $th = this.$outer_table.find('thead th.' + search_field_name);
            if ($th.length) {
                $th.find('*').hide();
                $th.css('position', 'relative');
                $th.append(search_form);
                search_form.show();
                if (search_input_focused) {
                    search_form.find('input').focus();
                }
            }
        }
        this.prev_scroll_top = this.$overlay_div.scrollTop();
        this.update_ellipse_btn(this.$table);
        this.cur_width = this.$container.width()
        this.cur_height = this.$container.height()
    },

    build(same_field_width) {
        if (!this.item) {
            return;
        }
        this.init_fields();
        this.check_datasource();
        if (this.field_width_updated !== undefined) {
            this.field_width_updated = same_field_width;
        }
        if (!this.item.selections) {
            this.options.multiselect = this.item.selections;
        }
        this.refresh();
        this.sync_col_width();
        this.syncronize();
    },

    show_footer() {
        this.$element.find("table.outer-table tfoot tr:first").show();
    },

    hideFooter() {
        this.$element.find("table.outer-table tfoot tr:first").hide();
    }
};
