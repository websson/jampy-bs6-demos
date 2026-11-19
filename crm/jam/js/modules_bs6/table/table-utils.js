import consts from "../consts.js";
import * as bootstrap from "bootstrap";

export const utilsMethods = {
    height(value) {
        if (value === undefined) {
            return this.$element.height();
        } else {
            this.$overlay_div.height(value - (this.$element.height() - this.$overlay_div.height()));
        }
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

    is_focused() {
        return this.$table.get(0) === document.activeElement;
    },

    focus() {
        if (!this.is_focused()) {
            this.$table.get(0).focus();
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
    }
};
