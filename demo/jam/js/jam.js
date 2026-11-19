"use strict";

import Task from "./modules_bs5/task.js";

(function($) {

    $.event.special.destroyed = {
        remove: function(o) {
            if (o.handler) {
                o.handler();
            }
        }
    };

    window.task = new Task();

})(jQuery);
