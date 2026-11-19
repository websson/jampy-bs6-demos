import consts from "../consts.js";
export const searchMethods = {
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
    }
};
