import consts from "./consts.js";
import * as bootstrap from 'bootstrap';

class DBAbstractInput {
    constructor(field) {
        this.field = field;
        this.read_only = false;
        this.is_changing = true;
    }

    add_to_dom(field, tabIndex, container) {
        let field_type = field.lookup_data_type;
        if (!field) {
            return;
        }
        let input = '<input type="text" class="form-control">',
            label = '<label class="form-label input-centered-label"></label>';
        
        if (task.settings.MODERN_INPUT_BTNS === false) {
            if (field.lookup_item || field.lookup_values ||
                field_type === consts.DATE || field_type === consts.DATETIME || field.bool_filter) {
                let icon_name = 'bi-chevron-down';
                if (field.lookup_item && !field.bool_filter) {
                    icon_name = 'bi-search';
                } else if (field_type === consts.DATE || field_type === consts.DATETIME) {
                    icon_name = 'bi-calendar';
                }
                // join filter upgrade
                let is_disabled = ((field.lookup_item && field.lookup_field1) || (!field.lookup_item && field.lookup_item1)) && field.field_kind !== consts.FILTER_FIELD ? ' disabled' : '';
                input = '<div class="input-group">' +
                    '<button type="button" class="first-btn btn btn-outline-secondary" tabindex="-1"><i class="bi bi-x-lg"></i></button>' +
                    '<input type="text" class="form-control"' + is_disabled + '>' +
                    '<button type="button" class="last-btn btn btn-outline-secondary" tabindex="-1"><i class="bi ' + icon_name + '"></i></button>' +
                '</div>';
            }
            else if (field_type === consts.FILE) {
                let field_file = (this.field.data_type === consts.FILE) ? 
                    this.field.field_file : 
                    this.field.lookup_item[this.field.lookup_field].field_file;
                
                input = '<div class="input-group">' +
                  '<button type="button" class="first-btn btn btn-outline-secondary" tabindex="-1"><i class="bi bi-x-lg"></i></button>' +
                  '<input type="text" class="form-control">' +
                  '<button type="button" class="upload-btn btn btn-outline-secondary" tabindex="-1"><i class="bi bi-upload"></i></button>';
                if (field_file.download_btn) {
                    input += '<button type="button" class="download-btn btn btn-outline-secondary" tabindex="-1"><i class="bi bi-download"></i></button>';
                }
                if (field_file.open_btn) {
                    input += '<button type="button" class="open-btn btn btn-outline-secondary" tabindex="-1"><i class="bi bi-play-btn"></i></button>';
                }
                input += '</div>';
            }
            else if (field_type === consts.IMAGE) {
                input = '<div class="image-div">';
            }
        }    
        else if (task.settings.MODERN_INPUT_BTNS === true) {
            if (field.lookup_item || field.lookup_values ||
                field_type === consts.DATE || field_type === consts.DATETIME || field.bool_filter) {

                let icon_name = 'bi-chevron-down';
                if (field.lookup_item && !field.bool_filter) {
                    icon_name = 'bi-search';
                } else if (field_type === consts.DATE || field_type === consts.DATETIME) {
                    icon_name = 'bi-calendar';
                }

                if (field_type === consts.DATE || field_type === consts.DATETIME) {
                    let clearBtn = '<button type="button" class="first-btn btn btn-seamless btn-middle-placement" tabindex="-1"><i class="bi bi-x-lg"></i></button>';
					let actionBtn = '<button type="button" class="last-btn btn btn-seamless rounded-end" tabindex="-1"><i class="bi ' + icon_name + '"></i></button>';

                    input = '<div class="input-group">' +
                        '<input type="text" class="form-control border-end-0">' +
                        clearBtn +
						actionBtn +
                    '</div>';
                } else {
                    let clearBtn = '<button type="button" class="first-btn btn btn-seamless btn-middle-placement" tabindex="-1"><i class="bi bi-x-lg"></i></button>';
                    let actionBtn = '<button type="button" class="last-btn btn btn-seamless rounded-end" tabindex="-1"><i class="bi ' + icon_name + '"></i></button>';

                    // join filter upgrade
                    let is_disabled = ((field.lookup_item && field.lookup_field1) || (!field.lookup_item && field.lookup_item1)) && field.field_kind !== consts.FILTER_FIELD ? ' disabled' : '';
                    input = '<div class="input-group">' +
                        '<input type="text" class="form-control border-end-0"' + is_disabled + '>' +
                        clearBtn +
                        actionBtn +
                    '</div>';
                }
            }
            else if (field_type === consts.FILE) {
                let field_file = (this.field.data_type === consts.FILE) ? 
                    this.field.field_file : 
                    this.field.lookup_item[this.field.lookup_field].field_file;
                
                let clearBtn = '<button type="button" class="first-btn btn btn-seamless btn-middle-placement" tabindex="-1"><i class="bi bi-x-lg"></i></button>';
                let uploadBtn = '<button type="button" class="upload-btn btn btn-seamless" tabindex="-1"><i class="bi bi-upload"></i></button>';
                
                input = '<div class="input-group">' +
                  '<input type="text" class="form-control border-end-0">' +
                  clearBtn +
                  uploadBtn;
                  
                if (field_file.download_btn) {
                    input += '<button type="button" class="download-btn btn btn-seamless" tabindex="-1"><i class="bi bi-download"></i></button>';
                }
                if (field_file.open_btn) {
                    input += '<button type="button" class="open-btn btn btn-seamless" tabindex="-1"><i class="bi bi-play-btn"></i></button>';
                }
                input += '</div>';
            }
            else if (field_type === consts.IMAGE) {
                input = '<div class="image-div">';
            }
        }
        
        if (field.lookup_data_type === consts.BOOLEAN) {
            input = '<input class="form-check-input check-box-centered-input" type="checkbox" value="">';
            label = '<label class="form-check-label checkbox-centered-label"></label>';
        } else if (field.lookup_data_type === consts.LONGTEXT || field.field_textarea) {
            input = '<textarea class="form-control" rows="3"></textarea>';
        } else if (this.floating_labels && (
            field_type === consts.TEXT ||
            field_type === consts.LONGTEXT ||
            field_type === consts.INTEGER ||
            field_type === consts.FLOAT ||
            field_type === consts.CURRENCY
        ) && !field.lookup_item && !field.lookup_values) {
            // Bootstrap 6 floating labels require: <div class="form-floating"><input ...><label>...</label></div>
            // Note: input must precede label in DOM for .form-floating, and input needs placeholder=""
            let innerInput = input;
            if (innerInput.indexOf('class="form-control"') !== -1) {
                innerInput = innerInput.replace('class="form-control"', 'class="form-control" placeholder=" "');
            } else if (innerInput.indexOf('class="form-control') !== -1) {
                innerInput = innerInput.replace(/class="form-control([^"]*)"/, 'class="form-control$1" placeholder=" "');
            }
            input = '<div class="form-floating">' + innerInput + '<label class="form-label"></label></div>';
            label = ''; // Label is inside form-floating
        }

        if (this.label_on_top || (this.floating_labels && (
            field.lookup_item || field.lookup_values || !(
                field_type === consts.TEXT ||
                field_type === consts.LONGTEXT ||
                field_type === consts.INTEGER ||
                field_type === consts.FLOAT ||
                field_type === consts.CURRENCY
            )
        ) && field.lookup_data_type !== consts.BOOLEAN)) {
            if (field.lookup_data_type === consts.BOOLEAN) {
                this.$container = $('<div class="mb-2"><div class="form-check">' + input + label + '</div></div>');
            } else {
                this.$container = $('<div class="mb-2">' + label + input + '</div>');
            }
        } else {
            if (field.lookup_data_type === consts.BOOLEAN) {
                this.$container = $('<div class="mb-2 row align-items-center">' +
                    '<div class="overflow-hidden md:col-' + this.label_size + '"><label class="col-form-label pt-0 pb-0"></label></div>' +
                    '<div class="md:col-' + (12 - this.label_size) + '">' +
                        '<div class="form-check">' + input + '</div>' +
                    '</div>' +
                '</div>');
            } else {
                let isFloating = this.floating_labels && !field.lookup_item && !field.lookup_values &&
                    (field_type === consts.TEXT || field_type === consts.LONGTEXT ||
                     field_type === consts.INTEGER || field_type === consts.FLOAT ||
                     field_type === consts.CURRENCY);
                if (isFloating) {
                    // No outer label column; label lives inside .form-floating
                    this.$container = $('<div class="mb-2">' + input + '</div>');
                } else {
                    this.$container = $('<div class="mb-2 row align-items-center">' +
                        '<div class="overflow-hidden md:col-' + this.label_size + '"><label class="col-form-label pt-0 pb-0"></label></div>' +
                        '<div class="md:col-' + (12 - this.label_size) + '">' + input + '</div>' +
                    '</div>');
                }
            }
        }

        if (this.field.field_help) {
            this.$container.append(
                '<div class="form-text field-help" style="display: none;">' + this.field.field_help + '</div>'
            );
        }
        if (container) {
            container.append(this.$container);
        }
        
        this.$label = this.$container.find('label');
        this.$input = this.$container.find('input');
        this.$first_btn = this.$container.find('button.first-btn');
        this.$last_btn = this.$container.find('button.last-btn');
        this.$upload_btn = this.$container.find('button.upload-btn');
        this.$download_btn = this.$container.find('button.download-btn');
        this.$open_btn = this.$container.find('button.open-btn');
        
        if (field_type === consts.IMAGE) {
            this.$input = this.$container.find('div.image-div');
        }
        if (this.field.lookup_data_type === consts.LONGTEXT || this.field.field_textarea) {
            this.$input = this.$container.find('textarea');
        }
        this.$form = this.$input.closest('.jam-form');

        this.$label.text(this.label).addClass(this.field.field_name);
        if (this.field.required) {
            this.$label.addClass('required');
        }
        this.$input.addClass(this.field.field_name);
        if (this.field.owner && this.field.owner.item_name) {
            let id = this.field.owner.item_name + '-' + this.field.field_name + '-id';
            this.$label.attr("for", id);
            this.$input.attr("id", id);
        }
        
        if (field_type === consts.DATE || field_type === consts.DATETIME) {
            //this.$container.attr("id", this.field.field_name + "_zebra_date_picker"); 
			this.$container.attr("id", this.field.field_name + "_date_picker"); 
            //this.$input.attr("data-zdp_readonly_element", "false");
            this.show_date_picker();
        }
    }
    
    init_buttons() {
		let self = this;
		this.$first_btn.click(function(e) {
			e.preventDefault();
			self.field.value = null;
		});

		// Prevent input blur when clicking last-btn
		this.$last_btn.on('mousedown', function(e) {
			e.preventDefault();
			if (self.dropdown) {
				self.dropdown.mousedover = true;
			}
		});

		this.$last_btn.click(function(e) {
			e.preventDefault();
			e.stopPropagation();

			if (self.field.lookup_values) {
				if (self.dropdown && self.dropdown.shown) {
					self.dropdown.hide();
				} else if (self.dropdown) {
					self.dropdown.query = '';
					self.dropdown.process(self.field.lookup_values);
				}
			} 
			
			else if (self.field.lookup_item) {
				self.select_value();
			}
			
			else if (self.field.data_type === consts.DATE ||
                self.field.data_type === consts.DATETIME) {
                self.show_date_picker();
            }
		});

		this.$upload_btn.click(function() {
			if (self.field.owner.is_changing() && !self.field.owner.read_only) {
				self.field.upload();
			}
		});
		this.$download_btn.click(function() {
			self.field.download();
		});
		this.$open_btn.click(function() {
			self.field.open();
		});
	}

    add_events() {
        let self = this,
            field_type = this.field.lookup_data_type;

        let field_mask = this.field.field_mask || this.field.get_mask();
        if (field_mask) {
            try {
                self.$input.mask(field_mask);
            } catch (e) {}
        }

        this.$input.off('.bs6_field');

        this.$input.on('focus.bs6_field', function(e) {
            self.focus_in(e);
        });

        this.$input.on('blur.bs6_field', function(e) {
            setTimeout(function() {
                if (!self.dropdown || !self.dropdown.mousedover) {
                    self.focus_out(e);
                }
            }, 150);
        });

        this.$input.on('mousedown.bs6_field', function(e) {
            self.mouseIsDown = true;
        });

        this.$input.on('mouseup.bs6_field', function(e) {
            if (!self.mouseIsDown) {
                self.$input.select();
            }
            self.mouseIsDown = false;
        });

        this.$input.on('keydown.bs6_field', function(e) {
            self.keydown(e);
        });

        this.$input.on('keyup.bs6_field', function(e) {
            self.keyup(e);
        });

        this.$input.on('keypress.bs6_field', function(e) {
            self.keypress(e);
        });

        if (this.dropdown && typeof this.dropdown.destroy === 'function') {
            this.dropdown.destroy();
            this.dropdown = null;
        }

        if (this.field.lookup_values) {
            this.dropdown = new DropdownList(this.field, this.$input);
            if (this.field.filter && this.field.bool_filter) {
                this.$input.parent().width(150);
            }
        } else if (this.field.lookup_item && field_type !== consts.FILE) {
            if (this.field.enable_typeahead) {
                let options = $.extend({}, this.field.typeahead_options(), { field: this.field });
                this.dropdown = new DropdownTypeahead(this.field, this.$input, options);
            }
        }

        if (this.field.data_type === consts.BOOLEAN) {
            this.$input.click(function(e) {
                self.field.value = !self.field.value;
            });
        } else if (this.field.data_type === consts.FILE) {
            this.$input.prop('disabled', true);
        } else if (this.field.data_type === consts.IMAGE) {
            this.$input.dblclick(function(e) {
                if (!self.field.read_only && self.field.data_type === consts.IMAGE &&
                    self.field.owner.is_changing() && !self.field.owner.read_only) {
                    if (e.ctrlKey || e.metaKey) {
                        self.field.value = null;
                    } else {
                        if (self.field.field_image && self.field.field_image.camera) {
                            self.init_camera(true);
                        } else {
                            self.field.upload_image();
                        }
                    }
                }
            });
        }

        this.field.controls.push(this);
        this.$input.bind('destroyed', function() {
            self.field.controls.splice(self.field.controls.indexOf(self), 1);
        });
    }

    create_input(field, tabIndex, container) {
        this.add_to_dom(field, tabIndex, container);
        this.init_buttons();
        this.add_events();
        this.update();
    }

    form_closing() {
        if (this.$form) {
            return this.$form.data('_closing');
        }
    }

    set_read_only(value) {
        let is_join_filter = (this.field.lookup_item && this.field.lookup_field1) || (!this.field.lookup_item && this.field.lookup_item1);
        if (is_join_filter && this.field.field_kind === consts.FILTER_FIELD) {
            value = false; // join filter upgrade
        } else if (is_join_filter) {
            value = true; // join filter upgrade
        }
        this.$first_btn.prop('disabled', value);
        this.$last_btn.prop('disabled', value);
        this.$upload_btn.prop('disabled', value);
        this.$download_btn.prop('disabled', value);
        this.$input.prop('disabled', value);
        if (this.field.lookup_data_type === consts.FILE) {
            this.$input.prop('disabled', true);
            if (this.field.lookup_value) {
                if (this.$open_btn) this.$open_btn.prop('disabled', false);
                if (this.$download_btn) this.$download_btn.prop('disabled', false);
            }
        }
    }

    init_camera(dblclick) {
        var self = this;
        if (this.field.field_image && this.field.field_image.camera && !this.$video) {
            if (task._getUserMediaError && dblclick) {
                this.field.upload_image();
                return;
            }
            if (navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({video: true})
                    .then(function(stream) {
                        var vid, size = self.field._get_image_size(true);
                        if (!self.$video) {
                            self.$video = $('<video width="'+ size.width + '" height="'+ size.height + '" autoplay>');
                            self.$input.bind('destroyed', function() {
                                try {
                                    self.$video[0].srcObject.getVideoTracks().forEach(track => track.stop());
                                } catch (e) {}
                            });
                            self.$input.parent().append(self.$video);
                            self.$input.hide();
                            vid = self.$video[0];
                            vid.srcObject = stream;
                            $(vid).on('dblclick', function() {
                                var $canvas = $('<canvas id="canvas" width="' + self.$video.width() + '" height="' + self.$video.height() + '">'),
                                    context = $canvas[0].getContext('2d');
                                $canvas.css({position: 'absolute', top: -1000});
                                $('body').append($canvas);
                                context.drawImage(vid, 0, 0, $canvas.width(), $canvas.height());
                                $canvas[0].toBlob(function(blob) {
                                    $canvas.remove();
                                    self.field.owner.task.upload({
                                        blob: blob,
                                        file_name: self.field.field_name + '.png',
                                        callback: function(server_file_name, file_name) {
                                            self.field.value = server_file_name;
                                            self.$video.hide();
                                            self.$input.show();
                                            vid.srcObject.getVideoTracks().forEach(track => track.stop());
                                            self.$video.remove();
                                            self.$video = undefined;
                                        }
                                    });
                                });
                            });
                        }
                    })
                    .catch(function(err) {
                        if (!task._getUserMediaError) {
                            task._getUserMediaError = true;
                            task.alert_error('Can not connect to the camera');
                            console.error('Error with getUserMedia: ' + err);
                            if (dblclick) {
                                self.field.upload_image();
                            }
                        }
                    });
            } else {
                alert('Sorry, your browser does not support getUserMedia');
            }
        }
    }

    update(state) {
        var placeholder, focused, is_changing = this.is_changing;
        if (this.field._owner_is_item()) {
            if (this.field.owner._canceling) {
                return;
            }
            is_changing = this.field.owner.is_changing();
            if (!this.field.owner.active || this.field.owner.record_count() === 0) {
                this.read_only = true;
                this.is_changing = false;
                this.set_read_only(true);
                this.$input.val('');
                return;
            }
        }
        if (!this.removed && !this.form_closing()) {
            if (this.field.lookup_data_type === consts.IMAGE) {
                if (this.$input.html() != this.field.get_html()) {
                    this.$input.html(this.field._get_image(true));
                }
                if (!this.field.value) {
                    this.init_camera();
                }
            } else {
                placeholder = this.field.field_placeholder;
                focused = this.$input.get(0) === document.activeElement;

                if (this.read_only !== this.field.read_only || is_changing !== this.is_changing) {
                    this.read_only = this.field.read_only;
                    this.is_changing = is_changing;
                    let is_disabled = (this.field.lookup_item && this.field.lookup_field1 && !this.field.lookup_field2) || (!this.field.lookup_item && this.field.lookup_item1 && !this.field.filter);
                    this.set_read_only(is_disabled || this.read_only || !this.is_changing); // join filter upgrade
                }
                if (this.field.master_field || ((this.field.lookup_item && this.field.lookup_field1 && !this.field.lookup_field2) || (!this.field.lookup_item && this.field.lookup_item1 && !this.field.filter))) {
                    this.set_read_only(true); // join filter upgrade
                }
                if (this.field.lookup_data_type === consts.BOOLEAN) {
                    this.$input.prop("checked", !!this.field.lookup_value);
                }
                if (this.field.lookup_values) {
                    this.$input.val(this.field.display_text);
                } else {
                    if (focused && this.$input.val() !== this.field.text ||
                        !focused && this.$input.val() !== this.field.display_text) {
                        this.errorValue = undefined;
                        this.error = undefined;
                        if (focused && !this.field.lookup_item && !this.field.lookup_values) {
                            this.$input.val(this.field.text);
                        } else {
                            this.$input.val(this.field.display_text);
                        }
                    }
                }
                if (this.read_only || !this.is_changing || this.field.master_field) {
                    placeholder = '';
                }
                this.$input.attr('placeholder', placeholder);
                this.updateState(true);
            }
        }
        if (state === consts.UPDATE_CLOSE) {
            this.$input.val('');
            this.set_read_only(true);
        }
    }

    keydown(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code === 13 && !(this.$input.get(0).tagName === 'TEXTAREA')) {
            e.preventDefault();
        }
        if (this.field.lookup_item && !this.field.enable_typeahead && !(code === 229 || code === 9 || code == 8)) {
            e.preventDefault();
        }
        if (code === 9) {
            if (this.table && this.table.edit_mode) {
                e.preventDefault();
                if (e.shiftKey) {
                    this.table.prior_field();
                } else {
                    this.table.next_field();
                }
            }
        }
    }

    enter_pressed(e) {
        if (this.field.lookup_item && !this.field.enable_typeahead) {
            e.stopPropagation();
            e.preventDefault();
            this.select_value();
        }
    }

    changed() {
        if (this.field.field_kind !== consts.ITEM_FIELD ||
            this.field.owner.active && this.field.owner.rec_count) {
            if (this.field.lookup_item || this.field.lookup_values) {
                if (this.$input.val() !== this.field.display_text) {
                    return true;
                }
            } else {
                if (this.$input.val() !== this.field.text) {
                    return true;
                }
            }
        }
    }

    keyup(e) {
        var typeahead, code = (e.keyCode ? e.keyCode : e.which);
        if (this.field.enable_typeahead && this.dropdown) {
            if (this.dropdown.shown) {
                return;
            }
        }
        if (code === 13 && !e.ctrlKey && !e.shiftKey) {
            if (this.table && this.table.edit_mode) {
                if (this.dropdown && this.dropdown.shown) {
                    return;
                }
                e.stopPropagation();
                e.preventDefault();
                this.table.close_editor();
            } else if (!(this.$input.get(0).tagName === 'TEXTAREA')) {
                this.focus_out();
                this.$input.select();
                this.enter_pressed(e);
            }
        } else if (code === 27) {
            if (this.table && this.table.edit_mode) {
                e.preventDefault();
                e.stopPropagation();
                this.table.item.cancel();
                this.table.hide_editor();
            } else if (this.changed()) {
                this.update();
                this.$input.select();
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    keypress(e) {
        var code = e.which;
        if (code === 13 && !(this.$input.get(0).tagName === 'TEXTAREA')) {
            e.preventDefault();
        } else {
            if (this.field.lookup_item && !this.field.enable_typeahead) {
                e.preventDefault();
            }
            if (!this.$input.is('select') && code && !this.field.valid_char_code(code)) {
                e.preventDefault();
            }
        }
    }

    show_date_picker() {
        var self = this, format, container;
        if (this.field.data_type === consts.DATE) {
            format = task.locale.D_FMT.replace(/%/g, "");
        } else if (this.field.data_type === consts.DATETIME) {
            format = task.locale.D_T_FMT.replace(/%/g, "").replace(/M/g, "i");
        }

        //modal form container
        var $dialog = this.$input.closest('dialog.dialog');
        if ($dialog.length) {
            container = $dialog;
        } else {
            container = $('body');
        }
				
		const input_datepicker = new JamDatePicker(this.$input, {
			format: format,
			theme: 'auto',
			firstDayOfWeek: parseInt(task.language.week_start, 10),
			closeOnSelect: true,
			position: 'auto',
			zIndex: 3000,
			container: container,
			openOnInputClick: false,
			i18n: {
				today: task.language.today,
				clear: task.language.clear,
				close: task.language.ok,
				monthsLong: task.language.months.slice(1, -1).split(','),
				monthsShort: task.language.months_short.slice(1, -1).split(','),
				daysMin: task.language.days_min.slice(1, -1).split(',')
			},
			onChange: function(dateObj, formattedStr) {
				self.field.value = dateObj;
			}
		});
		
		this.$last_btn.click(function(e) {
			input_datepicker.toggle();
		});

        /*this.$input.Zebra_DatePicker({
            first_day_of_week: parseInt(task.language.week_start, 10),
            format: format,
            days: task.language.days_min.slice(1, -1).split(','),
            months: task.language.months.slice(1, -1).split(','),
            months_abbr: task.language.months_short.slice(1, -1).split(','),
            show_icon: true,
            inside: true,
            open_icon_only: true,
            lang_clear_date: task.language.delete,
            show_clear_date: false,
            show_select_today: task.language.today,
            container: container,
            default_position: 'icon_top_right',
            onSelect: function(dateString, dateObj, instance) {
                self.field.value = instance;
            }
        });

        $('.Zebra_DatePicker_Icon').attr("tabindex", "-1");*/
    }

    select_value() {
        if (this.field.on_entry_button_click) {
            this.field.on_entry_button_click.call(this.item, this.field);
        } else {
            this.field.select_value();
        }
    }

    change_field_text() {
        var result = true, text;
        this.errorValue = undefined;
        this.error = undefined;
        if (this.field.lookup_item || this.field.lookup_values) {
            if (this.$input.val() !== this.field.lookup_text) {
                this.$input.val(this.field.display_text);
            }
        } else {
            try {
                text = this.$input.val();
                if (text !== this.field.text) {
                    if (this.field._owner_is_item() && !this.field.owner.is_changing()) {
                        this.field.owner.edit();
                    }
                    if (text === '') {
                        this.field.value = null;
                    } else {
                        this.field.text = text;
                        if (!(this.field._owner_is_item() && !this.field.owner.rec_count)) {
                            let err = this.field.check_valid();
                            if (err) throw new Error(err);
                            if (this.$input.is(':visible')) {
                                this.$input.val(text);
                            }
                        }
                    }
                }
            } catch (e) {
                this.errorValue = text;
                this.error = e;
                if (!(e.name && e.name === 'AbortError')) {
                    this.updateState(false);
                }
                result = false;
            }
        }
        return result;
    }

    focus_in(e) {
        if (!this.form_closing()) {
            this.hide_error();
            if (this.field.lookup_item && !this.field.enable_typeahead) {
                this.$input.val(this.field.display_text);
            } else {
                if (this.errorValue) {
                    this.$input.val(this.errorValue);
                } else if (this.field.lookup_item || this.field.lookup_values) {
                    this.$input.val(this.field.display_text);
                } else {
                    this.$input.val(this.field.text);
                }
                if (!this.mouseIsDown) {
                    this.$input.select();
                    this.mouseIsDown = false;
                }
            }
            this.mouseIsDown = false;
            this.updateState(true);
        }
    }

    focus_out(e) {
        var result = false;
        if (!this.changed()) {
            if (this.field.field_kind !== consts.ITEM_FIELD || this.field.owner.rec_count) {
                this.$input.val(this.field.display_text);
                return;
            }
        }
        if (this.table && this.table.edit_mode) {
            this.table.close_editor();
            result = true;
        }
        if (this.field.data_type === consts.BOOLEAN) {
            result = true;
        } else if (!this.table && this.change_field_text()) {
            if (this.$input.is(':visible')) {
                this.$input.val(this.field.display_text);
            }
            result = true;
        }
        this.updateState(result);
    }

    update_form(update) {
        if (update) {
            let form = this.$input.closest('.jam-form');
            if (form.hasClass('modal')) {
                this.field.owner.update_form(form);
            }
        }
    }

    hide(update_form) {
        this.$input.closest('.control-group').hide();
        this.update_form(update_form);
    }

    show(update_form) {
        this.$input.closest('.control-group').show();
        this.update_form(update_form);
    }

    updateState(value) {
        if (value) {
            this.errorValue = undefined;
            this.error = undefined;
            this.hide_error();
        } else {
            task.alert_error(this.error, {replace: false});
            this.show_error();
        }
    }

    show_error() {}
    hide_error() {}

    focus() {
        this.$input.focus();
    }
}


class DBTableInput extends DBAbstractInput {
    constructor(table, field) {
        super(field);
        this.table = table;
        this.create_input(field, 0);
        this.$input.attr("autocomplete", "off");
        this.$input.data('db_table_input_data', this);
        this.$input.addClass('db-table-input');
    }

    add_to_dom(field, tabIndex, container) {
        this.$input = $('<input type="text" class="form-control">');
        let align = this.field.lookup_data_type === consts.BOOLEAN ? 'center' : consts.align_value[this.field.alignment];
        this.$input.css("text-align", align);
        this.$form = this.$input.closest('.jam-form');
    }

    init_buttons() {}
}


class DBInput extends DBAbstractInput {
    constructor(field, index, container, options, label) {
        super(field);
        this.label = label;
        options = options || {};
        let item_options = (this.field && this.field.owner && this.field.owner.edit_options) ? this.field.owner.edit_options : {};
        let task_options = (this.field && this.field.owner && this.field.owner.task && this.field.owner.task.edit_options) ? this.field.owner.task.edit_options : {};

        this.label_width = options.label_width !== undefined ? options.label_width : (item_options.label_width !== undefined ? item_options.label_width : (task_options.label_width !== undefined ? task_options.label_width : undefined));
        this.label_on_top = options.label_on_top !== undefined ? options.label_on_top : (item_options.label_on_top !== undefined ? item_options.label_on_top : (task_options.label_on_top !== undefined ? task_options.label_on_top : false));
        this.floating_labels = options.floating_labels !== undefined ? options.floating_labels : (item_options.floating_labels !== undefined ? item_options.floating_labels : (task_options.floating_labels !== undefined ? task_options.floating_labels : false));
        this.label_size = options.label_size || item_options.label_size || task_options.label_size || 3;
        if (!this.label) {
            this.label = this.field.field_caption;
        }
        this.create_input(field, index, container);
        this.$input.data('db_input_data', this);
        this.$input.addClass('db-input');
    }

    show_error() {
        this.hide_error();
        this.$input.addClass('is-invalid');
        this.$input.parent().append('<div class="invalid-feedback">' + this.error + '</div>');
    }

    hide_error() {
        this.$input.removeClass('is-invalid');
        this.$container.find('div.invalid-feedback').remove();
    }
}

class Dropdown {
    constructor(field, element, options) {
        this.$element = element;
        this.field = field;
        this.options = $.extend({
            menu: '<div class="menu typeahead"></div>',
            item: '<a class="menu-item" href="#"></a>',
            length: 10,
            min_length: 1
        }, options);
        this.$menu = $(this.options.menu);
        this.listen();
    }

    show() {
		if (!this.$element || !this.$element.length) return;

		let el = this.$element[0];
		let rect = el.getBoundingClientRect();
		let $dialog = this.$element.closest('dialog');
		let inDialog = $dialog.length > 0;
		let container = inDialog ? $dialog : $('body');

		let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		let top = inDialog ? (rect.top - $dialog[0].getBoundingClientRect().top) : (rect.top + scrollTop);
		let left = inDialog ? (rect.left - $dialog[0].getBoundingClientRect().left) : (rect.left + scrollLeft);
		let height = rect.height;
		let width = this.$element.outerWidth();

		this.$menu.appendTo(container).css({
			display: 'block',
			visibility: 'hidden',
			opacity: 0,
			position: 'absolute'
		});

		let menuHeight = this.$menu.outerHeight();
		let windowHeight = $(window).height();
		let spaceBelow = windowHeight - (rect.top + height);

		let topPosition;
		if (spaceBelow < menuHeight && rect.top > menuHeight) {
			topPosition = top - menuHeight;
			this.$menu.addClass('dropup');
		} else {
			topPosition = top + height;
			this.$menu.removeClass('dropup');
		}

		this.$menu.css({
			top: topPosition + 'px',
			left: left + 'px',
			'min-width': width + 'px',
			'max-width': ($(window).width() - (rect.left + scrollLeft) - 20) + 'px',
			visibility: 'visible',
			opacity: 1,
			display: 'block'
		});

		this.shown = true;
		this.mousedover = false;

		// Attach outside-click handler dynamically every time menu opens
		let self = this;
		$(document).off('mousedown.dropdown_outside_' + this.cid)
				   .on('mousedown.dropdown_outside_' + this.cid, function(e) {
			if (!self.shown) return;
			let $target = $(e.target);
			if (!$target.closest(self.$menu).length && 
				!$target.closest(self.$element).length && 
				!$target.closest(self.$element.siblings('.last-btn')).length) {
				self.hide();
			}
		});

		return this;
	}

	hide() {
		this.$menu.hide();
		this.$menu.detach();
		this.shown = false;
		this.mousedover = false;
		if (this.cid) {
			$(document).off('mousedown.dropdown_outside_' + this.cid);
		}
		return this;
	}

    destroy() {
        $(document).off('.dropdown_outside_' + this.cid);
        if (this.$element) {
            this.$element.off('.dropdown_evt');
        }
        this.$element = undefined;
        this.$menu.remove();
    }

    get_items(event) {
        if (this.$element) {
            this.query = this.$element.val();
            if (!this.query || this.query.length < this.options.min_length) {
                return this.shown ? this.hide() : this;
            }
            let items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source;
            return items ? this.process(items) : this;
        }
    }

    lookup(event) {
        this.get_items(event);
    }

    process(items) {
        var that = this;
        items = $.grep(items || [], function(item) {
            return that.matcher(item);
        });

        if (!items.length) {
            return this.shown ? this.hide() : this;
        }

        return this.render(items.slice(0, this.options.length)).show();
    }

    matcher(item) {
        return true;
    }

    highlighter(item) {
        return typeof highlight === 'function' ? highlight(item, this.query) : item;
    }

    render(items) {
        var that = this;
        var $renderedItems = $(items).map(function(i, values) {
            var $item = $(that.options.item);
            var str = that.highlighter(typeof values === 'string' ? values : values[1]);
            $item.html(str || '&nbsp;');
            return $item[0];
        });

        $renderedItems.first().addClass('active');
        this.$menu.html($renderedItems);
        return this;
    }

    next() {
        var active = this.$menu.find('.menu-item.active'),
            next = active.next('.menu-item');

        if (!next.length) {
            next = this.$menu.find('.menu-item').first();
        }
        active.removeClass('active');
        next.addClass('active');
    }

    prev() {
        var active = this.$menu.find('.menu-item.active'),
            prev = active.prev('.menu-item');

        if (!prev.length) {
            prev = this.$menu.find('.menu-item').last();
        }

        active.removeClass('active');
        prev.addClass('active');
    }

    listen() {
		let self = this;
		if (!this.cid) {
			this.cid = Math.random().toString(36).substring(2, 9);
		}

		this.$element
			.off('.dropdown_evt')
			.on('focus.dropdown_evt', $.proxy(this.focus, this))
			.on('keypress.dropdown_evt', $.proxy(this.keypress, this))
			.on('keyup.dropdown_evt', $.proxy(this.keyup, this))
			.on('keydown.dropdown_evt', $.proxy(this.keydown, this));

		this.$menu
			.off('.dropdown_menu_evt')
			.on('mousedown.dropdown_menu_evt', '.menu-item', function(e) {
				e.preventDefault();
				e.stopPropagation();
				self.mousedover = true;
				self.select(e);
				if (self.$element) {
					self.$element.focus();
				}
			})
			.on('mouseenter.dropdown_menu_evt', '.menu-item', $.proxy(this.mouseenter, this))
			.on('mouseleave.dropdown_menu_evt', '.menu-item', $.proxy(this.mouseleave, this));
	}

    move(e) {
        if (!this.shown) return;

        switch (e.keyCode) {
            case 9:
            case 13:
            case 27:
                e.preventDefault();
                break;
            case 38:
                e.preventDefault();
                this.prev();
                break;
            case 40:
                e.preventDefault();
                this.next();
                break;
        }
        e.stopPropagation();
    }

    keydown(e) {
        this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40, 38, 9, 13, 27]);
        this.move(e);
    }

    keypress(e) {
        if (this.suppressKeyPressRepeat) return;
        this.move(e);
    }

    keyup(e) {
        if (!e.ctrlKey && !e.shiftKey) {
            switch (e.keyCode) {
                case 40:
                case 38:
                case 16:
                case 17:
                case 18:
                    break;
                case 9:
                case 13:
                    if (this.shown) {
                        this.select(e);
                    }
                    break;
                case 27:
                    if (!this.shown) return;
                    this.hide();
                    break;
            }
            e.stopPropagation();
        }
    }

    focus(e) {
        this.focused = true;
    }

    mouseenter(e) {
        this.mousedover = true;
        this.$menu.find('.menu-item.active').removeClass('active');
        $(e.currentTarget).addClass('active');
    }

    mouseleave(e) {
        this.mousedover = false;
    }
}

class DropdownList extends Dropdown {
    constructor(field, element, options) {
        super(field, element, options);
    }

    listen() {
        super.listen();
        const self = this;

        if (this.$element) {
            this.$element.off('input.dropdown_list').on('input.dropdown_list', function(e) {
                self.query = self.$element.val();
                if (self.field && self.field.lookup_values) {
                    self.process(self.field.lookup_values);
                }
            });
        }
    }

    matcher(item) {
        if (this.query) {
            return item[1].toLowerCase().indexOf(this.query.toLowerCase().trim()) !== -1;
        }
        return true;
    }

    render(items) {
        var that = this;
        var $renderedItems = $(items).map(function(i, values) {
            var $item = $(that.options.item).data('id-value', values[0]);
            var str = that.highlighter(values[1]);
            $item.html(str || '&nbsp;');
            return $item[0];
        });

        $renderedItems.first().addClass('active');
        this.$menu.html($renderedItems);
        return this;
    }

    select() {
        var $item = this.$menu.find('.menu-item.active').first();
        if (!$item.length) {
            $item = this.$menu.find('.menu-item').first();
        }

        if (this.field.owner && this.field.owner.is_changing && !this.field.owner.is_changing()) {
            this.field.owner.edit();
        }

        if ($item.length) {
            this.field.value = $item.data('id-value');
        }
        return this.hide();
    }

    enter_pressed() {
        this.query = '';
        if (this.$element) {
            this.$element.focus();
        }
        this.process(this.field.lookup_values);
    }

    source(query, process) {
        let data = [];
        if (this.field && this.field.lookup_values) {
            this.field.lookup_values.forEach(function(item) {
                if (item[1].toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                    data.push(item);
                }
            });
        }
        return process(data);
    }
}

class DropdownTypeahead extends Dropdown {    
    constructor(field, element, options) {
        super(field, element, options);
        this.source = this.options.source;
        this.lookup_item = this.options.lookup_item;

        this.matcher = function(item) {
            if (!this.query) return true;
            return item.toLowerCase().indexOf(this.query.toLowerCase().trim()) !== -1;
        };
    }

    listen() {
        super.listen();
        const self = this;

        if (this.$element) {
            // Bind on 'input' to trigger typeahead lookup on typing, backspace, and paste
            this.$element.off('input.typeahead').on('input.typeahead', function(e) {
                self.lookup(e);
            });
        }
    }

    lookup(event) {
        var self = this;
        clearTimeout(this.timeOut);
        this.timeOut = setTimeout(function() { self.get_items(event); }, 250);
    }

    get_items(event) {
        if (!this.$element) return;
        
        this.query = this.$element.val();
        if (!this.query || this.query.length < (this.options.min_length || 1)) {
            return this.shown ? this.hide() : this;
        }

        const self = this;
        const lookup_item = this.lookup_item || (this.field ? this.field.lookup_item : null);

        if (!lookup_item) return;

        const searchFields = (this.field && this.field.lookup_search_fields && this.field.lookup_search_fields.length) ? 
                              this.field.lookup_search_fields : 
                              (this.field && this.field.lookup_field ? [this.field.lookup_field] : ['name']);

        const clone = lookup_item.copy({ handlers: false });
        const term = this.query.trim();

        if (this.field) {
            if (this.field.owner && this.field.owner.on_field_select_value) {
                this.field.owner.on_field_select_value(this.field, clone);
            }
            if (this.field.on_field_select_value) {
                this.field.on_field_select_value(this.field, clone);
            }
        }

        let validFields = searchFields.filter(fName => clone._field_by_name(fName) !== undefined);
        if (!validFields.length) {
            validFields = [clone.lookup_field || 'name'];
        }

        let searchConditions = [];
        if (validFields.length === 1) {
            let cond = {};
            cond[validFields[0] + '__contains'] = term;
            searchConditions.push(cond);
        } else {
            let orConditions = [];
            validFields.forEach(fName => {
                let cond = {};
                cond[fName + '__contains'] = term;
                orConditions.push(cond);
            });
            searchConditions.push(orConditions);
        }

        let baseWhere = clone._where_list || [];
        if (baseWhere.length) {
            clone._where_list = [baseWhere, searchConditions];
        } else {
            clone.set_where(searchConditions);
        }

        clone.open(function() {
            let items = [];
            self.map = {};

            clone.each(function(rec) {
                let displayLabel = validFields
                    .map(fName => {
                        let f = rec.field_by_name(fName);
                        return f ? (f.display_text || f.value || '') : '';
                    })
                    .filter(Boolean)
                    .join(' ');

                let pkFieldName = rec._primary_key || 'id';
                let pkField = rec.field_by_name(pkFieldName);
                let pkVal = pkField ? pkField.value : rec.rec_no;

                if (displayLabel) {
                    items.push(displayLabel);
                    self.map[displayLabel] = pkVal;
                }
            });

            self.process(items);
        });
    }

    highlighter(item) {
        if (!this.query) return item;
        var query = this.query.trim().replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
        return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
            return '<strong class="typeahead-highlight">' + match + '</strong>';
        });
    }

	render(items) {
		var self = this;

		var filteredItems = [];
		if (items && items.length) {
			for (var k = 0; k < items.length; k++) {
				if (self.matcher(items[k])) {
					filteredItems.push(items[k]);
				}
			}
		}

		if (!filteredItems.length) {
			return this.hide();
		}

		var nodes = $(filteredItems).map(function (i, item) {
			var $item = $(self.options.item).data('value', item);
			
			if (self.map && self.map[item] !== undefined) {
				$item.data('id-value', self.map[item]);
			}
			
			$item.html(self.highlighter(item));
			return $item[0];
		});

		this.$menu.empty();
		nodes.first().addClass('active');

		this.$menu.html(nodes);
		return this.show();
	}

    next() {
        var active = this.$menu.find('.menu-item.active').first();
        var next = active.next('.menu-item');

        if (!next.length) {
            next = this.$menu.find('.menu-item').first();
        }

        this.$menu.find('.menu-item').removeClass('active');
        next.addClass('active');
    }

    prev() {
        var active = this.$menu.find('.menu-item.active').first();
        var prev = active.prev('.menu-item');

        if (!prev.length) {
            prev = this.$menu.find('.menu-item').last();
        }

        this.$menu.find('.menu-item').removeClass('active');
        prev.addClass('active');
    }

    select() {
        var $item = this.$menu.find('.menu-item.active').first();
        if (!$item.length) {
            $item = this.$menu.find('.menu-item').first();
        }

        var id_value = $item.data('id-value');
        if (id_value === undefined && this.map) {
            var label = $item.text().trim();
            id_value = this.map[label];
        }

        if (id_value === undefined || id_value === null) return this.hide();

        var display_text = $item.text().trim();
        var field = this.field;

        if (field) {
            var lookup_item = this.lookup_item || field.lookup_item;

            if (field.multi_select) {
                let current_values = Array.isArray(field.value) ? field.value.slice() : [];
                let current_lookups = Array.isArray(field.lookup_value) ? field.lookup_value.slice() : [];

                if (current_values.indexOf(id_value) === -1) {
                    current_values.push(id_value);
                    current_lookups.push(display_text);
                }

                if (field.filter) {
                    field.filter.set_value(current_values, current_lookups);
                    if (field.filter.update) {
                        field.filter.update(field);
                    }
                } else {
                    field.value = current_values;
                    field.lookup_value = current_lookups;
                }

                if (this.$element) {
                    this.$element.val('');
                }
            } else if (field.filter) {
                field.filter.set_value(id_value, display_text);

                if (this.$element) {
                    this.$element.val(display_text);
                }

                if (field.filter.update) {
                    field.filter.update(field);
                }
            } else {
                var owner = field.owner;

                if (owner && owner.is_changing && !owner.is_changing()) {
                    owner.edit();
                }

                var applySelection = function() {
                    if (owner && owner.disable_controls) {
                        owner.disable_controls();
                    }

                    field.value = id_value;
                    field.lookup_value = display_text;

                    if (this.$element) {
                        this.$element.val(display_text);
                    }

                    if (owner && owner.enable_controls) {
                        owner.enable_controls();
                    }

                    if (owner && owner.on_field_changed) {
                        owner.on_field_changed(field, lookup_item);
                    } else if (field.on_field_changed) {
                        field.on_field_changed(field, lookup_item);
                    }

                    if (field.update_controls) {
                        field.update_controls();
                    }

                    if (this.$element) {
                        this.$element.val(display_text);
                    }
                }.bind(this);

                if (lookup_item) {
                    var pk_field = lookup_item._primary_key || 'id';
                    var whereObj = {};
                    whereObj[pk_field] = id_value;

                    lookup_item._fields_list = null;

                    lookup_item.open({ where: whereObj }, function() {
                        if (lookup_item.record_count()) {
                            lookup_item.first();
                        }
                        applySelection();
                    });
                } else {
                    applySelection();
                }
            }
        }

        return this.hide();
    }

    enter_pressed() {
        if (this.shown) {
            this.select();
        } else if (this.field) {
            this.field.select_value();
        }
    }
}

function highlight(text, search) {
    var i = 0,
        result = text,
        substr,
        start,
        str,
        strings,
        pos,
        p = [];
    if (search) {
        text += '';
        strings = search.toUpperCase().split(' ');
        for (i = 0; i < strings.length; i++) {
            str = text.toUpperCase();
            substr = strings[i];
            if (substr) {
                start = 0;
                while (true) {
                    pos = str.indexOf(substr);
                    if (pos === -1) {
                        break;
                    } else {
                        p.push([start + pos, substr.length]);
                        str = str.substr(pos + substr.length);
                        start += pos + substr.length;
                    }
                }
            }
        }
        if (p.length) {
            p.sort(function(a, b) {
                return a[0] - b[0];
            });
            result = '';
            start = 0;
            for (i = 0; i < p.length; i++) {
                if (p[i][0] < start) {
                    if (p[i][0] + p[i][1] < start) {
                        continue;
                    } else {
                        p[i][1] = start - p[i][0];
                        p[i][0] = start;
                    }
                }
                result += text.substr(start, p[i][0] - start);
                result += '<strong class="typeahead-highlight">' + text.substr(p[i][0], p[i][1]) + '</strong>';
                start = p[i][0] + p[i][1];
            }
            if (start) {
                result += text.substr(start);
            }
        }
    }
    return result;
}

export { DBInput, DBTableInput, highlight };