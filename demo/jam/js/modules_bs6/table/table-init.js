import { highlight } from "../input.js";
import { DBTableInput } from "../input.js";
import consts from "../consts.js";
import * as bootstrap from "bootstrap";
export const initMethods = {
    init(item, container, options, master_table) {
        var self = this;

        if (!container.length) {
            return;
        }
        this.item = item;
        this.item._page_changed = false;
        this.id = item.task._grid_id++;
        this.datasource = [];
        this.$container = container;
        this.form = container.closest('.jam-form');
        this.$container.css('position', 'relative');
        this.master_table = master_table;
        this.is_mac = navigator.platform.toLowerCase().indexOf('mac') + 1;

        this.edit_mode = false;
        this._editable_fields = [];
        this._sorted_fields = [];
        this._multiple_sort = false;
        this.page = 0;
        this.record_count = 0;
        this.cell_widths = {};
        this.scrollLeft = 0;

        this.init_options(options);
        this.init_selections();
        this.init_fields();

        this.$element = $('<div class="dbtable">');

        this.$element.addClass(item.item_name);
        this.$element.append($('<div class="table-container" style="overflow-x:auto;">'));
        this.$element.append($('<div class="paginator text-center">'));

        if (this.options.table_class) {
            this.$element.addClass(this.options.table_class);
        }
        this.$element.data('dbtable', this);
        this.item.controls.push(this);

        // Initialize cleanup tracking
        this._timers = [];
        this._resizeObserver = null;

        if (this.master_table) {
            this.$element.addClass('freezed');
        }
        else {
            this._resizeObserver = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    self.resize();
                });
            });
            this._resizeObserver.observe(this.$container.get(0));
        }
        this.$element.bind('destroyed', function() {
            self.destroy();
            if (self.item && self.item.controls) {
                self.item.controls.splice(self.item.controls.indexOf(self), 1);
            }
        });

        this.$container.empty();
        this.$element.appendTo(this.$container);
        this.create_table();
        this.create_pager();
        this.init_context_menu();	//--> new option
		this.init_drag_columns();	//--> new option

        this.sync_freezed();

        if (item.active) {
            setTimeout(function() { self.do_after_open() }, 0);
        }
    },

    init_options(options) {
        var default_options = {
            table_class: undefined,
            multiselect: false,
            height: undefined,
            row_count: undefined,
            fields: [],
            column_width: {},
            title_line_count: 1,
            row_line_count: 1,
            expand_selected_row: 0,
            selections: undefined,
            select_all: true,
            selection_limit: undefined,
            tabindex: 0,
            striped: false,
            dblclick_edit: true,
            on_click: undefined,
            on_dblclick: undefined,
            on_pagecount_update: undefined,
            on_page_changed: undefined,
            on_get_table_context_menu: undefined,	// new option
			drag_columns: false,               // new option
			draggable_fields: undefined,	// new option
            editable: false,
            editable_fields: undefined,
            keypress_edit: true,
            selected_field: undefined,
            append_on_lastrow_keydown: false,
            sortable: false,
            sort_fields: {},
            sort_add_primary: false,
            row_callback: undefined,
            title_callback: undefined,
            summary_fields: [],
            show_footer: undefined,
            show_paginator: true,
            show_scrollbar: false,
            paginator_container: undefined,
            freeze_count: 0,
            exact_height: true,
            show_hints: true,
            hint_fields: undefined,
            auto_page_scroll: true
        };

        this.options = $.extend(true, {}, default_options, this.item.table_options);
        this.options = $.extend({}, this.options, options);
        this.options.height = task.px_size(this.options.height);
        if (!this.options.height && !this.options.row_count) {
            this.options.height = 480;
        }
        if (this.options.row_line_count < 1) {
            this.options.row_line_count = 0;
        }
        if (!this.options.row_line_count && !this.options.row_count) {
            this.options.row_count = 10;
        }
        if (options && options.title_word_wrap) {
            this.options.title_line_count = 0;
        }
        else if (this.options.title_line_count < 0 || this.options.title_line_count === undefined) {
            this.options.title_line_count = 1;
        }
        if (this.item.master) {
            this.options.select_all = false;
        }
        if (this.options.summary_fields && this.options.summary_fields.length) {
            this.options.show_footer = true
        }
        if (this.options.editable_fields && this.options.editable_fields.length) {
            this.options.editable = true;
        }
        if (this.options.sort_fields && this.options.sort_fields.length) {
            this.options.sortable = true;
        }

        this.on_dblclick = this.options.on_dblclick;
    },

    init_fields() {
        if (!this.item) {
            return;
        }
        var i = 0,
            len,
            field,
            fields = [];
        this.fields = [];
        if (this.options.fields.length) {
            fields = this.options.fields
        } else if (this.item.view_options.fields && this.item.view_options.fields.length) {
            fields = this.item.view_options.fields;
        } else if (!fields.length) {
            this.item.each_field(function(f) {
                if (f.field_name !== f.owner._primary_key && f.field_name !== f.owner._deleted_flag) {
                    fields.push(f.field_name);
                }
            });
        }
        if (fields.length) {
            len = fields.length;
            for (i = 0; i < len; i++) {
                field = this.item.field_by_name(fields[i]);
                if (field) {
                    this.fields.push(field);
                }
            }
        }

        this._editable_fields = [];
        if (this.options.editable_fields) {
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                if (this.options.editable_fields.indexOf(this.fields[i].field_name) !== -1) {
                    this._editable_fields.push(this.fields[i]);
                }
            }
        } else {
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                if (!this.fields[i].read_only) {
                    this._editable_fields.push(this.fields[i]);
                }
            }
        }
        this.init_selected_field();
        this.colspan = this.fields.length;
        if (this.options.multiselect) {
            this.colspan += 1;
        }
     },

    get_editable_fields() {
        var i,
            field,
            result = [];
        for (i = 0; i < this._editable_fields.length; i++) {
            field = this._editable_fields[i];
            if (!field.read_only && !field.master_field) {
                result.push(field)
            }
        }
        if (this.freezed_table) {
            let index;
            for (i = 0; i < this.options.freeze_count; i++) {
                index = result.indexOf(this.fields[i]);
                if (index !== -1) {
                    result.splice(index, 1);
                }
            }
        }
        return result;
     },

    init_selections() {
        var value;
        if (this.options.multiselect && !this.item.selections) {
            this.item.selections = [];
        }
        //~ if (this.item.selections && this.item.selections.length) {
        if (this.item.selections) {
            this.options.multiselect = true;
        }
        if (this.options.selections && this.options.selections.length) {
            this.item.selections = this.options.selections;
            this.options.multiselect = true;
        }
        if (this.item.lookup_field && this.item.lookup_field.multi_select) {
            value = this.item.lookup_field.data;
            this.options.select_all = this.item.lookup_field.multi_select_all;
            if (value instanceof Array) {
                this.item.selections = value;
            }
            else {
                this.item.selections = [];
            }
            this.options.multiselect = true;
        }
        this.item.select_all = this.options.select_all;
    },

    initKeyboardEvents() {
        var self = this,
            timeout;
        this.$table.on('keydown', function(e) {
            if (window._jam_command_palette_open || window._jam_command_palette_closing) {
                return;
            }
            let code = (e.keyCode ? e.keyCode : e.which);
            if (self.selected_field && !self.editing && (code === 37 || code === 39)) {
                e.preventDefault();
                e.stopPropagation();
            }
            clearTimeout(timeout);
            timeout = setTimeout( function() { self.keydown(e) }, 10 );
        });

        this.$table.on('keyup', function(e) {
            if (window._jam_command_palette_open || window._jam_command_palette_closing) {
                return;
            }
            clearTimeout(timeout);
            timeout = setTimeout( function() { self.keyup(e) }, 10 );
        });

        this.$table.on('keypress', function(e) {
            if (window._jam_command_palette_open || window._jam_command_palette_closing) {
                return;
            }
            self.keypress(e);
        });
    },

    //create_table() {

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

    init_search_inputs() {
        let self = this;
        this.fields.forEach(function(field) {
            if (self.item._can_search_on_field(field)) {
                self.create_search_input_form(field);
            }
        });
        this.$table.on('focus.search', function() {
            self.hide_search_inputs();
        });
    },

    hide_search_inputs($exclude_form) {
        let self = this,
            forms = this.$outer_table.find('thead th .title-search-input-form');
        forms.each(function() {
            let $form = $(this);
            if (!$exclude_form || $exclude_form.get(0) !== $form.get(0)) {
                self.hide_search_input_form($form);
            }
        });
    },

    hide_search_input_form($form) {
        let $input = $form.find('input');
        if ($form.is(":visible") && !$input.val().trim().length) {
            $form.hide();
            $form.parent().find('*').show();
            $form.remove();
        }
    },

    create_search_input_form(field, $th, $btn) {
        let self = this;
        if (!$th) {
            $th = this.$outer_table.find('thead th.' + field.field_name)
            $th.css('position', 'relative');
        }
        if ($btn) {
            $btn.remove();
        }
        $th.find('div *').hide();
        let $search_input_form = $(
            '<form class="title-search-input-form">' +
                '<label for="title-search-input" class="form-label title-search-input-label"></label>' +
                '<input class="form-control" id="title-search-input">' +
            '</form>'
        );
        $th.append($search_input_form);
        let $label = $th.find('label').text(field.field_caption),
            $input = $th.find('input');
        this.item._init_column_title_search(field, $input);
        $input.blur(function() {
            self.hide_search_input_form($search_input_form);
        });
        if ($btn) {
            $input.focus();
        }
        else {
            $input.focus(function() {
                self.hide_search_inputs($search_input_form);
            });
        }
        $input.keyup(function(e) {
            var code = e.which;
            if (code === 27) {
                e.preventDefault();
                e.stopPropagation();
                if (!self.item.paginate && self.item.master) {
                    self.hide_search_input_form($search_input_form);
                }
                else {
                    if (!$input.val().trim().length) {
                        self.hide_search_input_form($search_input_form);
                    }
                }
            }
            else if (code === 40) {
                self.$table.focus();
            }
        });
		
		//enter press handle
		$input.keydown(function(e) {
            var code = e.which;
            if (code === 13) {
                e.preventDefault();
				e.stopPropagation();
				//console.log('Enter pressed');
			}
		});
    },

    calculate() {
        var self = this,
            i,
            row_line_count,
            $element,
            $table,
            row,
            $td,
            margin,
            fix,
            row_height,
            elementHeight,
            selected_row_height,
            overlay_div_height;
        if (this.options.row_count && !this.options.row_line_count) {
            this.item.paginate = true;
            this.row_count = this.options.row_count;
            this.item._limit = this.row_count;
            return;
        }
        row_line_count  = this.options.row_line_count
        if (!row_line_count) {
            row_line_count = 1;
        }
        if (this.master_table) {
            this.row_count = this.master_table.row_count;
            this.text_height = this.master_table.text_height;
            this.row_height = this.master_table.row_height;
            this.selected_row_height = this.master_table.selected_row_height;

            this.height(this.master_table.height());
            this.$overlay_div.height(this.master_table.$overlay_div.height());
            return;
        }
        $element = this.$element.clone()
            .css("float", "left")
            .css("position", "absolute")
            .css("top", 100);
            //~ .css("top", -1000);
        $element.width(this.$container.width());
        if (!$element.width()) {
            $element.width($('body').width());
        }
        $('body').append($element);
        this.fill_title($element);
        this.fill_footer($element);
        this.create_pager($element)
        $table = $element.find("table.inner-table");
        if (this.item.selections && !this.item.master) {
            row = '<tr><td><div><input type="checkbox"></div></td><td><div>W</div></td></tr>';
        } else {
            row = '<tr><td><div>W</div></td></tr>';
        }
        for (i = 0; i < 10; i++) {
            $table.append(row);
        }
        $element.find('th div').css('margin', 0);
        $td = $table.find('tr:first td');
        this.text_height = $td.find('div').height();
        let $tr = $table.find('tr:nth-child(2)');
        row_height = $tr.outerHeight(true);
        margin = $table.innerHeight() - row_height * 10;
        if (margin < 0) {
            margin = 0;
        }
        this.row_margin = margin;
        this.row_height = row_height + (row_line_count - 1) * this.text_height;
        this.selected_row_height = 0;
        elementHeight = $element.outerHeight();
        overlay_div_height = $element.find('div.overlay-div').innerHeight();
        $element.remove();
        if (this.options.expand_selected_row) {
            this.selected_row_height = row_height + (this.options.expand_selected_row - 1) * this.text_height;
        }
        this.$overlay_div.height(this.options.height - (elementHeight - overlay_div_height) - $element.find('.paginator').outerHeight(true));
        if (this.options.row_count) {
            this.row_count = this.options.row_count;
            this.$overlay_div.height(this.row_height * this.options.row_count + this.row_margin);
            if (this.options.expand_selected_row) {
                this.$overlay_div.height(this.row_height * (this.options.row_count - 1) + this.selected_row_height + this.row_margin);
            }
        }
        else {
            this.calc_row_count();
        }
        if (this.item._paginate) {
            this.item._limit = this.row_count;
        }
        else if (this.form.hasClass('modal')) {
            setTimeout(
                function() {
                    if (self.row_count !== self.calc_row_count()) {
                        self.field_width_updated = false;
                        self.datasource = [];
                        self.refresh();
                    }
                },
                300
            );
        }
    },

    calc_row_count() {
        if (this.master_table) {
            return this.master_table.row_count;
        }
        let overlay_div_height = this.$overlay_div.innerHeight();
        if (this.options.expand_selected_row) {
            overlay_div_height = this.$overlay_div.height() - this.selected_row_height;
        }
        this.row_count = Math.floor(overlay_div_height / this.row_height);
        if (this.options.expand_selected_row) {
            this.row_count += 1;
        }
        if (this.row_count <= 0) {
            this.row_count = 1;
        }
        this.calc_overlay_div_height();
        return this.row_count;
    },

    calc_overlay_div_height() {
        //~ this.options.exact_height = false;
        if (this.options.exact_height) {
            let height = this.row_height * this.row_count;
            if (this.options.expand_selected_row) {
                height = this.row_height * (this.row_count - 1) + this.selected_row_height;
            }
            this.$overlay_div.height(height + this.row_margin);
        }
    },

    create_pager($element) {
        var self = this,
            $pagination,
            $pager,
            tabindex,
            pagerWidth;
        if (this.item._paginate) {
            tabindex = -1;
            if (this.options.show_paginator) {
                $pagination = $(
                    '<div class="btn-toolbar my-1 d-flex justify-content-center" role="toolbar" aria-label="Toolbar with button groups">' +
                        '<div class="btn-group me-1" >' +
                            '<button type="button" class="pg-btn-first btn btn-outline-secondary"><i class="bi bi-skip-backward-fill"></i></button>' +
                            '<button type="button" class="pg-btn-prior btn btn-outline-secondary"><i class="bi bi-caret-left-fill"></i></button>' +
                        '</div>' +
                        '<div class="input-group me-1">' +
                            '<div class="pg-page input-group-text">' + task.language.page + '</div>' +
                            '<input type="text" class="form-control pagination-input text-center" style="width: 100px;">' +
                            '<div class="input-group-text"><span>' + task.language.of + '</span><span class="page-count ms-1"></span></div>' +
                        '</div>' +
                        '<div class="page-count-text m-2"  style="min-width: 80px;">' +
                            '<span class="page-number"></span>' + '/ ' +
                            '<span class="page-count"></span>' +
                        '</div>' +
                        '<div class="btn-group">' +
                            '<button type="button"class="pg-btn-next btn btn-outline-secondary"><i class="bi bi-caret-right-fill"></i></button>' +
                            '<button type="button" class="pg-btn-last btn btn-outline-secondary"><i class="bi bi-skip-forward-fill"></i></button>' +
                        '</div>' +
                    '</div>'
                );

                if (task.media === 2) {
                    $pagination.find('.input-group *').hide();
                }
                else {
                    $pagination.find('.page-count-text').hide();
                }
                this.$fistPageBtn = $pagination.find('button.pg-btn-first');
                this.$fistPageBtn.on("click", function(e) {
                    self.first_page(true);
                    e.preventDefault();
                });
                this.$fistPageBtn.addClass("disabled");

                this.$priorPageBtn = $pagination.find('button.pg-btn-prior');
                this.$priorPageBtn.on("click", function(e) {
                    self.prior_page(true);
                    e.preventDefault();
                });
                this.$priorPageBtn.addClass("disabled");

                this.$nextPageBtn = $pagination.find('button.pg-btn-next');
                this.$nextPageBtn.on("click", function(e) {
                    self.next_page(true);
                    e.preventDefault();
                });

                this.$lastPageBtn = $pagination.find('button.pg-btn-last');
                this.$lastPageBtn.on("click", function(e) {
                    self.last_page(true);
                    e.preventDefault();
                });
                this.$pageInput = $pagination.find('input');
                this.$pageInput.val(1);
                this.$pageInput.on("keydown", function(e) {
                    var page,
                        code = (e.keyCode ? e.keyCode : e.which);
                    if (code === 13) {
                        page = parseInt(self.$pageInput.val(), 10);
                        e.preventDefault();
                        if (!isNaN(page) && (page > 0)) {
                            self.$pageInput.val(page);
                            self.set_page_number(page - 1);
                        }
                    }
                });
                $pager = $pagination.find('#pager').clone()
                    .css("float", "left")
                    .css("position", "absolute")
                    .css("top", -1000);
                $("body").append($pager);
                pagerWidth = $pager.width();
                $pager.remove();
            }
            else if (this.options.show_scrollbar) {
                $pagination = $(
                    '<div class="text-right" style="line-height: normal; padding-top: 0.5rem">' +
                        '<span class="small-pager">' +
                            '<span>' + task.language.page + ' </span>' +
                            '<span class="page-number"></span>' +
                            '<span>' + task.language.of + ' </span>' +
                            '<span class="page-count"></span>' +
                        '</span>' +
                    '</div>'
                )
            }
            if ($pagination) {
                this.$page_count = $pagination.find('.page-count');
                this.$page_number = $pagination.find('.page-number');
                if (this.options.paginator_container) {
                    this.options.paginator_container.empty();
                    this.options.paginator_container.append($pagination);
                } else {
                    if ($element) {
                        $element.find('.paginator').append($pagination);
                    } else {
                        this.$element.find('.paginator').append($pagination);
                    }
                }
                this.$page_count.text('');
                if (pagerWidth) {
                    $pagination.find('#pager').width(pagerWidth);
                }
            }
        }
        else {
        }
    },

    init_selected_field() {
        var field;
        if (!this.selected_field && this.editable_fields.length) {
            this.selected_field = this.editable_fields[0];
            if (this.options.selected_field) {
                field = this.item.field_by_name(this.options.selected_field);
                if (this.editable_fields.indexOf(field) !== -1) {
                    this.selected_field = field;
                }
            }
        }
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

    height(value) {
        if (value === undefined) {
            return this.$element.height();
        } else {
            this.$overlay_div.height(value - (this.$element.height() - this.$overlay_div.height()));
        }
    },

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

    show_footer() {
        this.$element.find("table.outer-table tfoot tr:first").show();
    },

    hideFooter() {
        this.$element.find("table.outer-table tfoot tr:first").hide();
    },

    get_cell_width(field_name) {
        return parseInt(this.cell_widths[field_name], 10);
    },

    set_сell_width(field_name, value) {
        this.cell_widths[field_name] = value;
    },

    init_table() {
        if (!this.item._page_changed) {
            this.init_fields();
            this._sorted_fields = this.item._open_params.__order;
            if (this.item._paginate) {
                if (this.item._offset === 0) {
                    this.page = 0;
                    this.update_page_info();
                }
                this.update_totals();
            } else {
                this.calc_summary();
            }
        }
        this.datasource = [];
        this.refresh();
    },

    form_closing() {
        if (this.form) {
            return this.form.data('_closing');
        }
    },

    do_after_open() {
        var self = this;
        this.prev_selected_rec_no = undefined;
        if (this.$table.is(':visible')) {
            this.init_table();
            this.sync_freezed();
        }
        else if (this.item && this.item.rec_count) {
            setTimeout(
                function() {
                    self.init_table();
                    self.sync_freezed();
                },
                1
            );
        }
    },

    update(state) {
        var self = this;
        if (this.form_closing()) {
            return;
        }
        switch (state) {
            case consts.UPDATE_OPEN:
                this.do_after_open();
                break;
            case consts.UPDATE_RECORD:
                this.refresh_row();
                break;
            case consts.UPDATE_SCROLLED:
                this.syncronize(true);
                break;
            case consts.UPDATE_CONTROLS:
                this.syncronize(true);
                this.build(true);
                break;
            case consts.UPDATE_CLOSE:
                this.$table.empty();
                break;
            case consts.UPDATE_APPLIED:
                if (this.options.summary_fields && this.options.summary_fields.length > 0) {
                    this.update_totals();
                }
                break;
            case consts.UPDATE_SUMMARY:
                this.update_summary();
                break;
            case consts.UPDATE_REFRESH:
                this.update_totals();
        }
    },

    update_summary() {
        if (!this.item) {
            return;
        }
        var field_name;
        for (field_name in this.item._fields_summary_info) {
            let field = this.item.field_by_name(field_name),
                text = this.item._fields_summary_info[field_name].text,
                value = this.item._fields_summary_info[field_name].value,
                new_text = '';
            if (this.item.on_field_get_summary) {
                if (field.data_type === consts.CURRENCY) {
                    value = task.round(value, task.locale.FRAC_DIGITS);//.toFixed(task.locale.FRAC_DIGITS);
                }
                new_text = this.item.on_field_get_summary.call(this.item, field, value);
            }
            if (!new_text) {
                new_text = text;
            }
            this.$foot.find('div.' + field_name).html(new_text);
        }

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

    update_selected(row) {
        if (!row) {
            row = this.row_by_record();
        }
        if (this.options.row_callback) {
            this.options.row_callback(row, this.item);
        }
    },

    record_by_row(row) {
        for (var i = 0; i < this.datasource.length; i++) {
            if (this.datasource[i][1] === row[0]) {
                return this.datasource[i][0]
            }
        }
    },

    row_by_record() {
        if (this.item && this.item.rec_count) {
            for (var i = 0; i < this.datasource.length; i++) {
                if (this.datasource[i][0] === this.item.rec_no) {
                    return $(this.datasource[i][1])
                }
            }
        }
    },

    refresh_row() {
        var self = this;
        this.each_field(function(field, i) {
            self.update_field(field, true);
        });
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

    update_ellipse_btn($parent) {
        let self = this;
        $parent.find('td > div').each(function() {
            let $td = $(this).parent(),
                $btn = $td.find('.hint-btn');
            const btnEl = $btn.eq(0).get(0);
            if (btnEl) {
                const tooltipInstance = bootstrap.Tooltip.getInstance(btnEl);
                if (tooltipInstance) {
                    tooltipInstance.hide();
                }
            }
            $btn.remove();
            if (Math.abs(this.offsetHeight - this.scrollHeight) > 1 ||
                Math.abs(this.offsetWidth - this.scrollWidth) > 1) {
                $td.css('position', 'relative');
                let $btn = $(
                    '<button type="button" class="btn btn-secondary hint-btn">' +
                        '<i class="bi bi-three-dots"></i>' +
                    '</button>'
                );
                $td.append($btn);
                let placement = 'right',
                    table_width = self.$table.width(),
                    container = self.$table;
                if (self.master_table) {
                    table_width = self.master_table.$table.width();
                    container = self.master_table;
                }
                if (table_width - ($(this).offset().left + $(this).width()) < 200) {
                    placement = 'left';
                }
                const newBtnEl = $btn.get(0);
                if (newBtnEl) {
                    bootstrap.Tooltip.getOrCreateInstance(newBtnEl, {
                        container: container.get(0),
                        placement: placement,
                        title: $(this).text(),
                        trigger: 'hover'
                    });
                }
                $btn.on('mousedown dblclick click', function(e) {
                    e.stopPropagation();
                });
            }
        });
    },

    check_datasource() {
        if (!this.item) {
            return;
        }
        var clone = this.item.clone(),
            first_rec = undefined;
        if (this.item._dataset) {
            for (var i = 0; i < this.datasource.length; i++) {
                if (this.item._dataset[this.datasource[i][0]] !== undefined) {
                    first_rec = this.datasource[i][0]
                    break;
                }
            }
        }
        this.datasource = [];
        this.fill_datasource(first_rec);
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

    is_focused() {
        return this.$table.get(0) === document.activeElement;
    },

    focus() {
        if (!this.is_focused()) {
            this.$table.get(0).focus();
        }
    },

    destroy() {
        // Clean up ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // Clear all timers
        if (this.scroll_timeout) {
            clearTimeout(this.scroll_timeout);
            this.scroll_timeout = null;
        }
        if (this.scroll_debounce) {
            clearTimeout(this.scroll_debounce);
            this.scroll_debounce = null;
        }
        if (this.scrolling) {
            clearTimeout(this.scrolling);
            this.scrolling = null;
        }
        if (this._sync_debounce_timer) {
            clearTimeout(this._sync_debounce_timer);
            this._sync_debounce_timer = null;
        }

        // Remove all event listeners with namespaces
        if (this.$element) {
            this.$element.off('.dbtable');
        }
        if (this.$table) {
            this.$table.off('.dbtable');
        }
        if (this.$overlay_div) {
            this.$overlay_div.off('.dbtable');
        }
        if (this.$outer_table) {
            this.$outer_table.off('.dbtable');
        }

        // Clean up editor
        if (this.editor) {
            this.hide_editor();
            this.editor = null;
        }

        // Clean up tooltips
        if (this.$element) {
            this.$element.find('[data-bs-toggle="tooltip"]').each(function() {
                var tooltip = bootstrap.Tooltip.getInstance(this);
                if (tooltip) {
                    tooltip.dispose();
                }
            });
        }

        // Clear references
        this.item = null;
        this.datasource = [];
        this.fields = [];
        this._editable_fields = [];
        this._sorted_fields = [];
    },
//},

    init_selected_field() {
        var field;
        if (!this.selected_field && this.editable_fields.length) {
            this.selected_field = this.editable_fields[0];
            if (this.options.selected_field) {
                field = this.item.field_by_name(this.options.selected_field);
                if (this.editable_fields.indexOf(field) !== -1) {
                    this.selected_field = field;
                }
            }
        }
    },

    init_search_inputs() {
        let self = this;
        this.fields.forEach(function(field) {
            if (self.item._can_search_on_field(field)) {
                self.create_search_input_form(field);
            }
        });
        this.$table.on('focus.search', function() {
            self.hide_search_inputs();
        });
    },

    initKeyboardEvents() {
        var self = this,
            timeout;
        this.$table.on('keydown', function(e) {
            let code = (e.keyCode ? e.keyCode : e.which);
            if (self.selected_field && !self.editing && (code === 37 || code === 39)) {
                e.preventDefault();
                e.stopPropagation();
            }
            clearTimeout(timeout);
            timeout = setTimeout( function() { self.keydown(e) }, 10 );
        });

        this.$table.on('keyup', function(e) {
            clearTimeout(timeout);
            timeout = setTimeout( function() { self.keyup(e) }, 10 );
        });

        this.$table.on('keypress', function(e) {
            self.keypress(e);
        });
     },

    init_table() {
        if (!this.item._page_changed) {
            this.init_fields();
            this._sorted_fields = this.item._open_params.__order;
            if (this.item._paginate) {
                if (this.item._offset === 0) {
                    this.page = 0;
                    this.update_page_info();
                }
                this.update_totals();
            } else {
                this.calc_summary();
            }
        }
        this.datasource = [];
        this.refresh();
    },

    form_closing() {
        if (this.form) {
            return this.form.data('_closing');
        }
    },

    do_after_open() {
        var self = this;
        this.prev_selected_rec_no = undefined;
        if (this.$table.is(':visible')) {
            this.init_table();
            this.sync_freezed();
        }
        else if (this.item && this.item.rec_count) {
            setTimeout(
                function() {
                    self.init_table();
                    self.sync_freezed();
                },
                1
            );
        }
    }
};