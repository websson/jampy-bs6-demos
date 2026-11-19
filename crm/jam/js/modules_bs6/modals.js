import consts from "./consts.js";
import * as bootstrap from 'bootstrap';

const z_index_base = 999,
    z_index_inc = 2;

class ModalForm {
    constructor(modal_forms, $form_content, options, item, form_type) {
        this.modal_forms = modal_forms;
        this.$form_content = $form_content;
        this.item = item;
        this.form_type = form_type;
        this.options = options;
        this.create_form();
    }

    add_to_dom() {
		this.$active_element = $(':focus');
		
		this.$modal = $(
			'<dialog class="dialog dialog-slide-up jam-modal modal" data-bs-backdrop="static" data-bs-keyboard="false">' +
				'<div class="dialog-body modal-body" style="padding: 0"></div>' +
			'</dialog>'
		);
		
		this.$modal_body = this.$modal.find('.dialog-body');
		// Set $modal_dialog to point to $modal directly so existing references keep working seamlessly
		this.$modal_dialog = this.$modal; 
		
		this.$modal_body.append(this.$form_content);
		$('body').append(this.$modal);

		if (this.options.width) {
			this.$modal.css('max-width', this.options.width);
		}
	}

	create_modal() {
        let self = this,
            form = this.$modal.get(0);

        // Bootstrap 6 Dialog instance
        this.form_object = bootstrap.Dialog.getOrCreateInstance(form);

        // PREVENT Native <dialog> escape cancel event from racing with Jam.py
        form.addEventListener('cancel', function(e) {
            e.preventDefault(); // Stop native HTML5 dialog auto-close
            if (self.options.close_on_escape) {
                if (self.item) {
                    self.item._close_form(self.form_type);
                } else {
                    self.close_form();
                }
            }
        });

        // Events updated from .bs.modal to .bs.dialog
        form.addEventListener('show.bs.dialog', function(event) {
            event.stopPropagation();
            self.layout();
            if (self.item) {
                try {
                    self.item._process_event(self.form_type, 'created');
                }
                finally {
                    self.item._set_form_options(self.$form_content, self.options, self.form_type);
                }
            }
            if (self.options.width) {
                self.$modal.css('max-width', self.options.width);
            }
            // Hide form content before modal becomes visible so that
            // on_edit_form_shown DOM mutations (width, visibility, etc.)
            // are applied before the first browser paint of the modal.
            self.$form_content.css('visibility', 'hidden');
        });

        form.addEventListener('shown.bs.dialog', function(event) {
            event.stopPropagation();

            self.layout();

            let z_index = z_index_base + self.modal_forms.stack.length * 2 * z_index_inc;
            self.$modal.css("z-index", z_index + z_index_inc);

            if (task.media === 0) {
                self.modal_forms.task._focus_element(self.$form_content);
            }
            if (self.$form_content.on_shown) {
                self.$form_content.on_shown();
            }
            if (self.item) {
                self.item._process_event(self.form_type, 'shown');
            }
            // Reveal form content after all shown callbacks have run.
            self.$form_content.css('visibility', '');
        });

        form.addEventListener('hide.bs.dialog', function(event) {
            event.stopPropagation();
        });

        form.addEventListener('hidden.bs.dialog', function(event) {
            event.stopPropagation();
        });

        this.form_object.show();

        if (this.item) {
            this.item['modal_' + this.form_type + '_object'] = this;

            let key_suffix = this.item._key_suffix(this.form_type, this.options);
            this.$form_content.on("keydown." + key_suffix, function(e) {
                self.item._process_key_event(self.form_type, 'keydown', e);
            });
            this.$form_content.on("keyup." + key_suffix, function(e) {
                self.item._process_key_event(self.form_type, 'keyup', e);
            });
        }

        // Handle ESC key closing option cleanly
        this.$modal.on('keydown.modalform keyup.modalform', function(e) {
            if (e.which === 27) { // ESC key
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (e.type === 'keyup' && self.options.close_on_escape) {
                    e.preventDefault();
                    if (self.item) {
                        self.item._close_form(self.form_type);
                    } else {
                        self.close_form();
                    }
                }
            }
        });

        this.$modal.on('keypress.modalform', function(e) {
            e.stopPropagation();
        });

        // Draggable dialog header logic
        let header = this.$modal.find('.form-header').get(0);
        let dragHandle = this.$modal.find('.form-header-title').get(0);

        if (header && dragHandle) {
            let modal = this.$modal.get(0),
                isDragging = false,
                offset = { x: 0, y: 0 };

            dragHandle.style.cursor = "grab";
            dragHandle.style.userSelect = "none";

            dragHandle.addEventListener('mousedown', function (e) {
                if (e.target.closest('button, a, input, select, textarea')) {
                    return;
                }

                isDragging = true;
                e.preventDefault();

                const rect = modal.getBoundingClientRect();

                offset = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };

                modal.style.marginLeft = '0';
                modal.style.marginRight = '0';
                modal.style.left = (e.clientX - offset.x) + 'px';
                modal.style.top = (e.clientY - offset.y) + 'px';

                dragHandle.style.cursor = "grabbing";
            });

            document.addEventListener('mousemove', function (e) {
                if (!isDragging) return;
                modal.style.left = e.clientX - offset.x + 'px';
                modal.style.top = e.clientY - offset.y + 'px';
            });

            document.addEventListener('mouseup', function () {
                if (isDragging) {
                    isDragging = false;
                    dragHandle.style.cursor = "grab";
                }
            });
        }
    }

    create_form() {
        try {
            this.add_to_dom();
            this.create_modal();
        }
        catch (e) {
            console.error(e);
        }
    }

    close_form() {
        // Safely hide and dispose of BS6 Dialog instance
        if (this.form_object) {
            try {
                this.form_object.hide();
            } catch (e) {}
        }
        
        // Remove key listeners bound to modal DOM
        this.$modal.off('.modalform');
        
        // Unregister from modal stack and destroy DOM element
        this.modal_forms.destroy_modal_form(this);
    }

    layout() {
        const winW = $(window).width();
        const isMobile = winW < 768;
        const optWidth = this.options.width;
        const pxWidth = this.modal_forms.task.px_size(optWidth);

        if (!isMobile && winW > pxWidth) {
            // Desktop: respect the configured width, center via margin:auto
            this.$modal_dialog.css({
                'max-width': optWidth,
                'width': optWidth,
                'margin-left': 'auto',
                'margin-right': 'auto'
            });
        } else {
            // Mobile / narrow viewport: fill width with small padding so buttons are always reachable
            this.$modal_dialog.css({
                'max-width': 'calc(100% - 1rem)',
                'width': 'calc(100% - 1rem)',
                'margin-left': '0.5rem',
                'margin-right': '0.5rem'
            });
        }

        // Ensure dialog body can scroll on mobile so footer buttons are reachable
        this.$modal.find('.dialog-body').css('overflow-y', isMobile ? 'auto' : '');
    }
}

class ModalForms {
    constructor(task) {
        let self = this;
        this.task = task;
        this.stack = [];

        let resize_timeout;
        $(window).on('resize.modalforms', function(){
            if (self.stack.length) {
                resize_timeout && clearTimeout(resize_timeout);
                resize_timeout = setTimeout(function(){
                    for (var i = 0; i < self.stack.length; i++){
                        self.stack[i].layout();
                    }
                }, 100);
            }
        });
    }

    get active_modal_form() {
        if (this.stack.length) {
            return this.stack[this.stack.length - 1];
        }
    }

    create_modal_form($form_content, options, item, form_type) {
        let modal_form = new ModalForm(this, $form_content, options, item, form_type);
        this.stack.push(modal_form);
        return modal_form;
    }

    destroy_modal_form(modal_form) {
        if (modal_form === this.active_modal_form) {
            modal_form.destroying = true;
            if (modal_form.item) {
                modal_form.item['modal_' + modal_form.form_type + '_object'] = undefined;
            }
            modal_form.form_object.hide();
            modal_form.$modal.remove();
            
            if (modal_form.$active_element && modal_form.$active_element.length && document.body.contains(modal_form.$active_element.get(0))) {
                modal_form.$active_element.focus();
            }
            
            this.stack.pop();

            //bug fix
            if (this.stack.length === 0) {
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open').css({
                    overflow: '',
                    paddingRight: ''
                });
                $('html').removeClass('dialog-open');
                document.documentElement.classList.remove('dialog-open');
            }
        }
    }
}

export default ModalForms
