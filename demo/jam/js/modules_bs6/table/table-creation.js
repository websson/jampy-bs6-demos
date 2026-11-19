import consts from "../consts.js";
export const creationMethods = {
    create_table() {
        var self = this,
            $doc = $(document),
            $selection,
            $th,
            $td,
            $thNext,
            delta = 0,
            mouseX;
        this.colspan = this.fields.length;
        if (this.options.multiselect) {
            this.colspan += 1;
        }
        this.$element.find('.table-container').append($(
            '<table class="outer-table table table-condensed table-bordered caption-top" style="width: 100%;">' +
            '   <thead>' +
            '       <tr><th>&nbsp</th></tr>' +
            '   </thead>' +
            '   <tr>' +
            '       <td id="top-td" style="padding: 0; border: 0;" colspan=' + this.colspan + '>' +
            '           <div class="overlay-div" style="position: relative; width: 100%; height: 100%; overflow-y: auto; overflow-x: hidden;">' +
            '               <div class="scroll-div" style="position: relative; height: auto;">' +
            '                   <table class="inner-table table table-condensed table-bordered" style="position: absolute; width: 100%">' +
            '                       <tbody></tbody>' +
            '                   </table>' +
            '               </div>' +
            '           </div>' +
            '       </td>' +
            '   </tr>' +
            '   <tfoot class="outer-table">' +
            '       <tr><th>&nbsp</th></tr>' +
            '   </tfoot>' +
            '</table>'));
        this.$table_container = this.$element.find(".table-container")
        this.$outer_table = this.$element.find("table.outer-table")
        this.$overlay_div = this.$element.find('div.overlay-div');
        this.$scroll_div = this.$element.find('div.scroll-div');
        this.$table = this.$element.find("table.inner-table");
        this.$head = this.$element.find("table.outer-table thead tr:first");
        this.$foot = this.$element.find("table.outer-table tfoot tr:first");
        this.is_modal = this.$element.closest('.modal').length > 0;

        if (this.item._paginate && !this.options.show_scrollbar) {
            this.$overlay_div.css('overflow-y', 'hidden');
        }
        if (this.options.row_count && !this.options.row_line_count) {
            this.$table.css('position', 'relative');
        }

        this.$overlay_div.scroll(function(e) {
            self.scroll(e);
        });

        this.$overlay_div.on('mousewheel', function(e) {
            e.preventDefault();
        });

        this.$overlay_div.on('keydown', function(e) {
            if ([32, 33, 34, 35, 36, 38, 40].indexOf(e.keyCode) > -1) {
                if (!self.editor) {
                    e.preventDefault();
                }
            }
        });

        this.$outer_table.css("margin", 0)

        this.$table.css("outline", "none")
            .css("margin", 0)
            .css("border", 0)

        if (this.options.striped) {
            this.$table.addClass("striped");
        }

        let clicked_touchstart;

        this.$table.on('touchstart mousedown dblclick', 'td', function(e) {
            if (e.type === 'mousedown' && e.which === 3) {
                return;
            }
            if (e.type === 'touchstart') {
                clicked_touchstart = true;
                return;
            }
            let syncronize = false;
            if (!clicked_touchstart) {
                syncronize = true;
            }
            let td = $(this);
            if (this.nodeName !== 'TD') {
                td = $(this).closest('td');
            }
            if (!(self.editing && td.find('input').length)) {
                e.preventDefault();
                self.clicked(e, td);
                if (syncronize) {
                    self.syncronize();
                    if (self.datasource.length > self.row_count) {
                        self.datasource.length = self.row_count;
                        self.$table.find('tr:last-child').remove();
                    }
                }
            }
        });

        this.$element.on('mousewheel DOMMouseScroll', 'div.overlay-div, table.inner-table', function(e){
            e.stopPropagation();
            if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
                self.prior_record();
            }
            else {
                self.next_record();
            }
        });

        this.$table.on('click', 'td', function(e) {
            if (self.options.on_click) {
                self.options.on_click.call(self.item, self.item);
            }
        });

        let is_touchstart_event;
        this.$outer_table.on('touchstart mouseenter', 'th', function(e) {
            if (e.type === "touchstart") {
                is_touchstart_event = true;
                return;
            }
            if (e.type === "mouseenter") {
                if (is_touchstart_event) {
                    is_touchstart_event = false;
                    return;
                }
            }
            let $th = $(this),
                field_name = $th.data('field_name'),
                field = self.item.field_by_name(field_name);
            if (self.item.view_options.enable_search &&
                !$th.find('input').length && field &&
                self.item._can_search_on_field(field)) {

                $th.css('position', 'relative');
                let $btn = $(
                    '<button type="button" class="btn btn-secondary title-search-btn">' +
                        '<i class="bi bi-search"></i>' +
                    '</button>'
                );
                $th.append($btn);
                $btn.on('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    let $active_input = $th.parent().find('th input#title-search-input');
                    if ($active_input.length && $active_input.val()) {
                        let $form = $active_input.parent(),
                            active_field_name = $form.parent().data('field_name');
                        $active_input.val('');
                        self.hide_search_inputs();
                        self.item.search(active_field_name, '', 'contains_all', true, function() {
                            let $th = self.$outer_table.find('thead th.' + field_name)
                            $th.css('position', 'relative');
                            self.create_search_input_form(field, $th, $btn)
                        });
                    }
                    else {
                        self.create_search_input_form(field, $th, $btn)
                    }
                });
            }
        });

        this.$outer_table.on('mouseleave', 'th', function(e) {
            $(this).find('.title-search-btn').remove();
        });

        this.$table.on('mousedown', 'td input.multi-select', function(e) {
            var $this = $(this),
                checked = $this.is(':checked');
            self.clicked(e, $this.closest('td'));
            self.selections_set_selected(!checked);
            $this.prop('checked', self.selections_get_selected());
            if (e.shiftKey && self.prev_selected_rec_no !== undefined) {
                let sels = [],
                    clone = self.item.clone(),
                    min = self.prev_selected_rec_no,
                    max = self.item.rec_no;
                if (self.prev_selected_rec_no > self.item.rec_no) {
                    min = self.item.rec_no;
                    max = self.prev_selected_rec_no;
                }
                while (min < max) {
                    min += 1;
                    clone.rec_no = min;
                    if ($this.is(':checked')) {
                        self.item.selections.add(clone._primary_key_field.value);
                    }
                    else {
                        self.item.selections.remove(clone._primary_key_field.value);
                    }
                }
                self.refresh();
            }
            self.prev_selected_rec_no = self.item.rec_no;
        });

        this.$table.on('click', 'td input.multi-select', function(e) {
            var $this = $(this);
            e.stopPropagation();
            e.preventDefault();
            $this.prop('checked', self.selections_get_selected());
        });

        this.$element.on('click', 'input.multi-select-checkbox', function(e) {
            self.selections_set_all_selected($(this).is(':checked'));
        });

        this.$table.attr("tabindex", this.options.tabindex);

        this.initKeyboardEvents();

        this.$element.on('mousemove.table-title', 'table.outer-table thead tr:first th', function(e) {
            var $this = $(this),
                field_name = $this.data('field_name'),
                lastCell = self.$element.find("thead tr:first th:last").get(0);
            if ($this.outerWidth() - e.offsetX < 8 && !mouseX && (this !== lastCell || self.master_table)) {
                $this.css('cursor', 'col-resize');
            } else if (self.options.sortable && //!self.item.master &&
                (!self.options.sort_fields.length || self.options.sort_fields.indexOf(field_name) !== -1)) {
                $this.css('cursor', 'pointer');
            } else {
                $this.css('cursor', 'default');
            }
        });

        function captureMouseMove(e) {
            var newDelta = delta + e.screenX - mouseX,
                left = parseInt($selection.css("left"), 10);
            if (mouseX) {
                e.preventDefault();
                if (newDelta > -($th.innerWidth() - 30)) {
                    delta = newDelta;
                    $selection.css('left', left + e.screenX - mouseX);
                }
                mouseX = e.screenX;
            }
        }

        function change_field_width($title, delta) {
            var field_name = $title.data('field_name');
            self.change_field_width(field_name, delta);
        }

        function release_mouse_move(e) {
            var field_name,
                $td,
                $tf,
                cell_width;
            $doc.off("mousemove.table-title");
            $doc.off("mouseup.table-title");

            self.column_resizing = true;
            try {
                change_field_width($th, delta);
                self.update_ellipse_btn(self.$table);
            }
            finally {
                setTimeout(
                    function() {
                        self.column_resizing = false
                    }, 100);
            }

            mouseX = undefined;
            $selection.remove()
        }

        this.$element.on('mousedown.table-title', 'table.outer-table thead tr:first th', function(e) {
            var $this = $(this),
                index,
                lastCell,
                field_name = $this.data('field_name'),
                cur_field_name,
                new_fields = [],
                index,
                desc = false,
                next_field_name,
                field,
                parent,
                top,
                left,
                sorted_fields;
            lastCell = self.$element.find("thead tr:first th:last").get(0);
            if ($this.outerWidth() - e.offsetX < 8 && (this !== lastCell || self.master_table)) {
                $this.css('cursor', 'default');
                mouseX = e.screenX;
                $th = $this;
                index = self.fields.indexOf(self.item.field_by_name(field_name))
                delta = 0;
                $doc.on("mousemove.table-title", captureMouseMove);
                $doc.on("mouseup.table-title", release_mouse_move);
                parent = self.$container.closest('.modal');
                if (parent.length) {
                    left = $this.offset().left - parent.offset().left;
                    top = self.$element.offset().top - parent.offset().top;
                }
                else {
                    parent = $('body');
                    left = $this.offset().left;
                    top = self.$element.offset().top;
                }
                $selection = $('<div>')
                    .addClass('selection-box')
                    .css({
                        'width': 0,
                        'height': self.$outer_table.find('thead').innerHeight() +
                            self.$overlay_div.innerHeight() + self.$outer_table.find('tfoot').innerHeight(),
                        'left': left + $this.outerWidth(),
                        'top': top
                    });

                $selection.appendTo(parent);
            } else if (field_name && self.options.sortable &&
                (!self.options.sort_fields.length || self.options.sort_fields.indexOf(field_name) !== -1)) {

                if (e.ctrlKey) {
                    if (!self._multiple_sort) {
                        self._multiple_sort = true;
                    }
                } else {
                    if (self._multiple_sort) {
                        self._sorted_fields = [];
                        self._multiple_sort = false;
                    }
                }
                sorted_fields = self._sorted_fields.slice();
                if (self._multiple_sort) {
                    index = -1;
                    for (var i = 0; i < sorted_fields.length; i++) {
                        if (sorted_fields[i][0] === field_name) {
                            index = i;
                            break;
                        }
                    }
                    if (index === -1) {
                        sorted_fields.push([field_name, false])
                    } else {
                        sorted_fields[index][1] = !sorted_fields[index][1];
                    }
                } else {
                    if (sorted_fields.length && sorted_fields[0][0] === field_name) {
                        sorted_fields[0][1] = !sorted_fields[0][1];
                    } else {
                        sorted_fields = [
                            [field_name, false]
                        ];
                    }
                }
                self._sorted_fields = sorted_fields.slice();
                self.item._open_params.__order = self._sorted_fields;
                if (!self.item._paginate) {
                    self.item._sort(self._sorted_fields);
                } else {
                    if (self.options.sort_add_primary) {
                        field = self.item[self.item._primary_key]
                        desc = self._sorted_fields[self._sorted_fields.length - 1][1]
                        self._sorted_fields.push([field.field_name, desc]);
                    }
                    self.item.open({
                        params: self.item._open_params,
                        offset: 0
                    }, true);
                }
            }
        });

        this.$table.focus(function(e) {
            if (self.master_table) {
                self.master_table.close_editor();
            }
            if (self.freezed_table) {
                self.freezed_table.close_editor();
            }
            self.syncronize(true);
        });

        this.$table.blur(function(e) {
            self.syncronize(true);
        });

        this.fill_footer();
        this.calculate();
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

    create_freezed_table() {
        var i,
            options,
            container;
        options = $.extend({}, this.options)
        options.show_paginator = false;
        options.fields = [];
        options.freeze_count = 0;
        options.fields = this.get_freezed_fields();
        container = $('<div>')
        this.freezed_table = new DBTable(this.item, container, options, this)
        this.freezed_table.$element.detach()
        this.freezed_table.$element.css('position', 'absolute');
        this.freezed_table.$element.css('left', '0');
        this.freezed_table.$element.css('top', '0');
        this.freezed_table.$element.css('overflow', 'hidden');
        this.freezed_table.$table_container.css('overflow', 'hidden');
        this.freezed_table.$outer_table.css('overflow', 'hidden');
        this.freezed_table.$overlay_div.css('overflow', 'hidden');

        this.freezed_table.$container = this.$container;
        this.$container.append(this.freezed_table.$element);
     },

    delete_freezed_table() {
        this.freezed_table.$element.remove();
        delete this.freezed_table
        this.freezed_table = undefined;
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
    }
};
