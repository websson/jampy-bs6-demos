"use strict";

//import * as bootstrap from "./bs6/bootstrap.bundle.js";
import * as bootstrap from "bootstrap";
import Task from "./modules_bs6/task.js";

window.bootstrap = bootstrap;

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

