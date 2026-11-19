import consts from "../consts.js";
export const scrollingMethods = {
    scroll(e) {
        var self = this,
            scroll_el,
            table_el;
        if (this.is_mac) {
            scroll_el = this.$scroll_div[0];
            table_el = this.$table[0];
            if (!this.pointer_events_set) {
                scroll_el.style.pointerEvents = 'none';
                table_el.style.pointerEvents = 'none';
            }
            this.pointer_events_set = true;
            clearTimeout(this.scroll_debounce);
            this.scroll_debounce = setTimeout(function () {
                scroll_el.style.pointerEvents = 'auto';
                table_el.style.pointerEvents = 'auto';
                self.pointer_events_set = false;
            }, 50);

        }
        if (this.table_scroll) {
            this.table_scroll = false;
            this.$table.css({'top': this.$overlay_div.scrollTop() + 'px'});
        }
        else {
            this.scroll_table(e);
            if (this.item.paginate) {
                this.$table.css({'top': this.$overlay_div.scrollTop() + 'px'});
            }
            else {
                this.$table.css({'top': (this.$overlay_div.scrollTop() - this.scroll_delta) + 'px'});
                //~ clearTimeout(this.scrolling);
                //~ this.scrolling = setTimeout(function () {
                    //~ let rec_no = self.record_by_row(self.$table.find('tr').eq(0))
                    //~ if (rec_no !== undefined) {
                        //~ self.item.rec_no = rec_no;
                    //~ }
                //~ }, 100);
            }
        }
    },

    scroll_table(e) {
        var self = this,
            scroll_top = this.$overlay_div.scrollTop(),
            page_rec = scroll_top / this.row_height;
        page_rec = Math.floor(page_rec);
        this.scroll_delta = (scroll_top / this.row_height - page_rec) * this.row_height;
        //~ if (scroll_top > this.prev_scroll_top) {
            //~ page_rec = Math.ceil(page_rec);
        //~ }
        //~ else {
            //~ page_rec = Math.floor(page_rec);
        //~ }
        this.prev_scroll_top = this.$overlay_div.scrollTop();
        if (this.item.paginate) {
            var page = Math.round(page_rec / this.row_count);
            this.$table.addClass('paginate-scroll');
            this.update_page_info(page);
            clearTimeout(this.scroll_timeout);
            this.scroll_timeout = setTimeout(
                function() {
                    self.$table.removeClass('paginate-scroll');
                    if (page !== self.page) {
                        self.table_scroll = true;
                        self.set_page_number(page);
                    }
                },
                200
            );
        }
        else {
            this.scroll_datasource(page_rec);
            if (this.freezed_table) {
                this.freezed_table.scroll_datasource(page_rec);
            }
            if (this.master_table) {
                this.master_table.scroll_datasource(page_rec);
            }
            this.cancel_sync();
            try {
                this.refresh();
                if (this.freezed_table) {
                    this.freezed_table.refresh();
                }
                if (this.master_table) {
                    this.master_table.refresh();
                }
            }
            finally {
                this.resume_sync();
            }
        }
    },

    scroll_datasource(page_rec) {
        this.datasource = [];
        this.fill_datasource(page_rec, 1);
    },

    scroll_height() {
        var delta = this.$overlay_div.innerHeight() - this.row_count * this.row_height;
        if (this.item.paginate) {
            return Math.ceil(this.record_count / this.row_count) * this.row_count * this.row_height;
        }
        else {
            return this.item.record_count() * this.row_height + delta;
        }
    },

    scroll_pos_by_rec() {
        if (this.item.paginate) {
            return Math.round((this.page * this.row_count + this.item.rec_no) * this.row_height);
        }
        else {
            return Math.round(this.item.rec_no * this.row_height);
        }
    }
};
