(function($, task) {
"use strict";

function Events1() { // crm_app 

	function on_page_loaded(task) { 
		$("#app-title").text(task.item_caption);
	
		if (task.user_info && task.user_info.user_name) {
			let nameParts = task.user_info.user_name.trim().split(/\s+/);
			let initials = '';
			if (nameParts.length >= 2) {
				initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
			} else if (nameParts.length === 1 && nameParts[0].length > 0) {
				initials = nameParts[0].substring(0, 2).toUpperCase();
			} else {
				initials = 'U';
			}
			$('#user-avatar-initials').text(initials);
		}
	
		$('#menu-pass-change').click(function(e) {
		  e.preventDefault();
		  task.change_password.open({open_empty: true});
		  task.change_password.append_record();
		});
	
		$('#menu-log-out').click(function(e) {
		  e.preventDefault();
		  task.logout();
		});
	
	
		if (task.settings.SMALL_FON) {
			$('html').css('font-size', '13px');
		}
		if (task.full_width) {
			$('#container').removeClass('container').addClass('container-fluid');
		}
		  
		if (task.safe_mode) {
			$("#user-info").text(task.user_info.role_name + ' ' + task.user_info.user_name);
			$('#log-out')
			.show() 
			.click(function(e) {
				e.preventDefault();
				task.logout();
			}); 
		}
	
		$('#container').show();
	
		task.create_menu($("#menu"), $("#content"), {
			splash_screen: '<h1 class="text-center">Jam.py Demo Application</h1>',
			view_first: true,
			create_single_group: false,
			create_group_for_single_item: false
		});
	
		$("#menu-right #admin a").click(function(e) {
			var admin = [location.protocol, '//', location.host, location.pathname, 'builder.html'].join('');
			e.preventDefault();
			window.open(admin, '_blank');
		});
		
		$("#menu-right #about a").click(function(e) {
			e.preventDefault();
			task.message(
				task.templates.find('.about'),
				{title: 'Jam.py framework', margin: 0, text_center: true, 
					buttons: {"OK": undefined}, center_buttons: true}
			);
		});
	
		$("#menu-right #pass a").click(function(e) {
			e.preventDefault();
			task.change_password.open({open_empty: true});
			task.change_password.append_record();
		});
	
		// $(document).ajaxStart(function() { $("html").addClass("wait"); });
		// $(document).ajaxStop(function() { $("html").removeClass("wait"); });
	} 
	
	function on_view_form_created(item) {
		var table_options_height = item.table_options.height,
			table_container;
	
		item.paginate = false; 
		// item.table_options.show_paginator = false;
		// item.table_options.show_scrollbar = true;
		
		item.clear_filters();
		
		item.view_options.table_container_class = 'view-table';
		item.view_options.detail_container_class = 'view-detail';
		item.view_options.open_item = !item.virtual_table;
		
		if (item.view_form.hasClass('modal-form')) {
			item.view_options.width = 1060;
			item.table_options.height = $(window).height() - 300;
			item.view_options.close_button = true;
		}
		else {
			if (!item.table_options.height) {
				item.table_options.height = $(window).height() - $('body').height();
			}
	
			item.view_options.close_button = false;
		}
		
		if (item.can_create()) {
			item.view_form.find("#new-btn").on('click.task', function(e) {
				e.preventDefault();
				if (item.master) {
					item.append_record();
				}
				else {
					item.insert_record();
				}
			});
		}
		else {
			item.view_form.find("#new-btn").prop("disabled", true);
		}
	
		item.view_form.find("#edit-btn").on('click.task', function(e) {
			e.preventDefault();
			item.edit_record();
		});
	
		if (item.can_delete()) {
			item.view_form.find("#delete-btn").on('click.task', function(e) {
				e.preventDefault();
				item.delete_record();
			});
		}
		else {
			item.view_form.find("#delete-btn").prop("disabled", true);
		}
		
		create_print_btns(item);
	
		task.view_form_created(item);
		
		if (!item.master && item.owner.on_view_form_created) {
			item.owner.on_view_form_created(item);
		}
	
		if (item.on_view_form_created) {
			item.on_view_form_created(item);
		}
		
		item.create_view_tables();
		
		if (!item.master && item.view_options.open_item) {
			item.open(true);
		}
	
		if (!table_options_height) {
			item.table_options.height = undefined;
		}
		
		translate_btns(item.view_form.find('.form-footer'));
		return true;
	}
	
	function on_view_form_shown(item) {
		item.view_form.find('.dbtable.' + item.item_name + ' .inner-table').focus();
	}
	
	function on_view_form_closed(item) {
		if (!item.master && item.view_options.open_item) {	
			item.close();
		}
	}
	
	function on_edit_form_created(item) {
		item.edit_options.inputs_container_class = 'edit-body';
		item.edit_options.detail_container_class = 'edit-detail';
		
		item.edit_form.find("#cancel-btn").on('click.task', function(e) { item.cancel_edit(e) });
		item.edit_form.find("#ok-btn").on('click.task', function() { item.apply_record() });
		if (!item.is_new() && !item.can_modify) {
			item.edit_form.find("#ok-btn").prop("disabled", true);
		}
		
		task.edit_form_created(item);
		
		if (!item.master && item.owner.on_edit_form_created) {
			item.owner.on_edit_form_created(item);
		}
	
		if (item.on_edit_form_created) {
			item.on_edit_form_created(item);
		}
			
		item.create_inputs(item.edit_form.find('.' + item.edit_options.inputs_container_class));
		item.create_detail_views(item.edit_form.find('.' + item.edit_options.detail_container_class));
	
		translate_btns(item.edit_form.find('.form-footer'));
		return true;
	}
	
	function on_edit_form_shown(item) {
		if (item.check_field_value) {
			item.each_field( function(field) {
				var input = item.edit_form.find('input.' + field.field_name);
				input.blur( function(e) {
					var err;
					if ($(e.relatedTarget).attr('id') !== "cancel-btn") {
						err = item.check_field_value(field);
						if (err) {
							item.alert_error(err);
							input.focus();			 
						}
					}
				});
			});
		}
	}
	
	function on_edit_form_close_query(item) {
		var result = true;
		if (item.is_changing() && item.is_new()) {
			result = false;
			if (item.is_modified()) {
				item.yes_no_cancel(task.language.save_changes,
					function() {
						item.apply_record();
					},
					function() {
						item.cancel_edit();
					}
				);
			}
			else {
				item.cancel_edit(); // GH358
			}
		}
		return result;
	}
	
	function on_filter_form_created(item) {
		item.filter_options.title = item.item_caption + ' - filters';
		item.filter_form.find("#cancel-btn").on('click.task', function() {
			item.close_filter_form();
		});
		item.filter_form.find("#ok-btn").on('click.task', function() {
			item.set_order_by(item.view_options.default_order);
			item.apply_filters(item._search_params);
		});
		if (!item.master && item.owner.on_filter_form_created) {
			item.owner.on_filter_form_created(item);
		}
		if (item.on_filter_form_created) {
			item.on_filter_form_created(item);
		}
		item.create_filter_inputs(item.filter_form.find(".edit-body"));	
		translate_btns(item.filter_form.find('.form-footer'));	
		return true;
	}
	
	function on_param_form_created(item) {
		item.param_form.find("#cancel-btn").on('click.task', function() { 
			item.close_param_form();
		});
		item.param_form.find("#ok-btn").on('click.task', function() { 
			item.process_report();
		});
		if (item.owner.on_param_form_created) {
			item.owner.on_param_form_created(item);
		}
		if (item.on_param_form_created) {
			item.on_param_form_created(item);
		}
		item.create_param_inputs(item.param_form.find(".edit-body"));	
		translate_btns(item.filter_form.find('.form-footer'));
		return true;
	}
	
	function on_before_print_report(report) {
		var select;
		report.extension = 'pdf';
		if (report.param_form) {
			select = report.param_form.find('select');
			if (select && select.val()) {
				report.extension = select.val();
			}
		}
	}
	
	function on_view_form_keyup(item, event) {
		if (event.keyCode === 45 && event.ctrlKey === true){
			if (item.master) {
				item.append_record();
			}
			else {
				item.insert_record();				
			}
		}
		else if (event.keyCode === 46 && event.ctrlKey === true){
			item.delete_record(); 
		}
	}
	
	function on_edit_form_keyup(item, event) {
		if (event.keyCode === 13 && event.ctrlKey === true){
			item.edit_form.find("#ok-btn").focus(); 
			item.apply_record();
		}
	}
	
	function create_print_btns(item) {
		var i,
			$ul,
			$li,
			reports = [];
		if (item.reports) {
			for (i = 0; i < item.reports.length; i++) {
				if (item.reports[i].can_view()) {
					reports.push(item.reports[i]);
				}
			}
			if (reports.length) {
				$ul = item.view_form.find("#report-btn ul");
				for (i = 0; i < reports.length; i++) {
					$li = $('<li><a class="dropdown-item" href="#">' + reports[i].item_caption + '</a></li>');
					$li.find('a').data('report', reports[i]);
					$li.on('click', 'a', function(e) {
						e.preventDefault();
						$(this).data('report').print(false);
					});
					$ul.append($li);
				}
			}
			else {
				item.view_form.find("#report-btn").hide();
			}
		}
		else {
			item.view_form.find("#report-btn").hide();
		}
	}
	
	function translate_btns(container) {
		container.find('.btn').each(function() {
			let btn = $(this).clone();
			btn.find('i', 'small').remove()
			let text = btn.text().trim();
			text = text.split()[0].split('[')[0];
			text = text.trim();
			let translation = task.language[text.toLowerCase()];
			if (translation) {
				$(this).html($(this).html().replace(text, translation)) 
			}
		});
	}
	this.on_page_loaded = on_page_loaded;
	this.on_view_form_created = on_view_form_created;
	this.on_view_form_shown = on_view_form_shown;
	this.on_view_form_closed = on_view_form_closed;
	this.on_edit_form_created = on_edit_form_created;
	this.on_edit_form_shown = on_edit_form_shown;
	this.on_edit_form_close_query = on_edit_form_close_query;
	this.on_filter_form_created = on_filter_form_created;
	this.on_param_form_created = on_param_form_created;
	this.on_before_print_report = on_before_print_report;
	this.on_view_form_keyup = on_view_form_keyup;
	this.on_edit_form_keyup = on_edit_form_keyup;
	this.create_print_btns = create_print_btns;
	this.translate_btns = translate_btns;
}

task.events.events1 = new Events1();

function Events6() { // crm_app.journals.companies 

	function on_edit_form_shown(item) {
		item.edit_form.find('input.annual_revenue').width(200);
		item.edit_form.find('input.created_at').parent().width(200);
		item.edit_form.find('input.name').focus();
	
		let $fieldContainer = item.edit_form.find('.website').closest('.mb-2');
			$('<button class="btn-solid theme-secondary w-100 mt-2" type="button"><i class="bi bi-box-arrow-up-right"></i></button>')
				.on('click', function() {
					 window.open('https://' + item.website.value, '_blank');
				})
				.appendTo($fieldContainer);
	}
	
	function on_edit_form_created(item) {
		item.edit_options.floating_labels = true;
		item.add_edit_button('Test btn', {type: 'primary'});
	
		if (item.is_new()) {
			item.edit_options.title = 'New customer';
		}   else {
			item.edit_options.title = 'Customer #' + item.id.value;
		}
	
		item.assigned_rep_id.enable_typeahead = true;
		item.assigned_rep_id.lookup_search_fields = ['first_name', 'last_name'];
	}
	
	function on_field_get_html(field) {
		if (field.field_name === 'name') {
			//return '<span class="badge bg-info text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
			return `<span class="chip theme-primary active">${field.display_text}</span>`;
		}
	
		if (field.field_name === 'assigned_rep_id') {
			return `<span class="chip theme-success">${field.display_text}</span>`;
		}
	}
	
	function on_view_form_created(item) {
		item.add_view_button('Test btn', {type: 'primary'});
		item.add_view_button('Test btn', {type: 'primary'});
		item.add_view_button('Test btn', {type: 'primary'});
	}
	this.on_edit_form_shown = on_edit_form_shown;
	this.on_edit_form_created = on_edit_form_created;
	this.on_field_get_html = on_field_get_html;
	this.on_view_form_created = on_view_form_created;
}

task.events.events6 = new Events6();

function Events7() { // crm_app.journals.contacts 

	function on_edit_form_created(item) {
		item.edit_options.floating_labels = true;
		if (item.master) {
			if (item.is_new()) {
				item.company_id.lookup_value = item.master.name.value;
				item.edit_options.title = 'New contact';
			}   else {
				item.company_id.lookup_value = item.master.name.value;
				item.edit_options.title = 'Contact #' + item.id.value;
	
				item.add_edit_button('Add deal', {type: 'primary', image: 'bi bi-folder2-open'}).click(function() {
					add_deal(item);
				});
			}
		}
	}
	
	function on_edit_form_shown(item) {
		item.edit_form.find('input.first_name').focus();
		item.edit_form.find('input.lead_score').width(60);
	}
	
	function add_deal(item) {
		const deals = task.deals.copy();
			deals.open({open_empty: true});
			deals.edit_options.title = 'New deal for customer ' + item.company_id.lookup_value;
			deals.append_record();
			
			deals.company_id.read_only = true;
			deals.contact_id.read_only = true;
			//deals.edit_form.find('.stage').focus();
	
			deals.company_id.value = item.company_id.value;
			deals.company_id.lookup_value = item.company_id.lookup_value;
			deals.contact_id.value = item.id.value;
			deals.contact_id.lookup_value = item.first_name.value + ' ' + item.last_name.value;
	
			deals.on_after_apply = function(c) {
				c.master.refresh_record();
				c.edit();
				c.cancel_edit();
				item.alert_success('New deal saved!');
			};
	}
	
	function on_field_get_html(field) {
		if (field.field_name === 'is_decision_maker' && field.value === true) {
			return '<i class="bi bi-check2-square fs-5"></i>';
		}
		
		if (field.field_name === 'company_id') {
			return `<span class="chip theme-success">${field.display_text}</span>`;
		}
	
		if (['first_name', 'last_name'].includes(field.field_name)) {
		   return `<span class="chip theme-success">${field.display_text}</span>`;
		}
	}
	
	function on_view_form_created(item) {
		if (!item.master) {
			item.view_form.find('#new-btn').hide();
		}
	}
	this.on_edit_form_created = on_edit_form_created;
	this.on_edit_form_shown = on_edit_form_shown;
	this.add_deal = add_deal;
	this.on_field_get_html = on_field_get_html;
	this.on_view_form_created = on_view_form_created;
}

task.events.events7 = new Events7();

function Events8() { // crm_app.journals.deals 

	function on_field_select_value(field, lookup_item) {
		const item = field.owner;
	
		if (field.field_name === 'contact_id' && lookup_item) {
			lookup_item.set_where({company_id: item.company_id.value});
		}
	}
	
	function on_edit_form_created(item) {
		if (item.is_new()) {
			item.edit_options.title = 'New deeal';
			item.contact_id.read_only = true;
	
			if (item.master) {
				item.company_id.lookup_value = item.master.name.value;
			}
		}   else {
			item.edit_options.title = 'Deal #' + item.id.value;
	
			if (item.master) {
				item.company_id.read_only = true;
				item.company_id.lookup_value = item.master.name.value;
			}
		}
	
		item.company_id.enable_typeahead = true;
		item.company_id.lookup_search_fields = ['name', 'industry'];
	
		item.contact_id.enable_typeahead = true;
		item.contact_id.lookup_search_fields = ['email', 'first_name', 'last_name'];
	
		item.create_inputs(item.edit_form.find("#deal-info"), {
			fields: ['title', 'company_id', 'company_id', 'stage', 'deal_value', 'expected_close_date', 'probability', 'deal_status'],
			in_well: false,
		});
	
		item.create_inputs(item.edit_form.find("#deal-progress"), {
			fields: ['deal_products_sum', 'deal_products_count', 'id', 'company_annual_revenue'],
			in_well: false,
		});
	}
	
	function on_field_changed(field, lookup_item) {
		const item = field.owner;
	
		if (field.field_name === 'company_id') {
			if (field.value) {
				item.contact_id.read_only = false;
			}   
			
			else if (field.value == null) {
				item.contact_id.value = null;
				item.contact_id.read_only = true;
			}
		}
	
		if (field.field_name === 'stage') {
			//won
			if (field.value == 4) {
				item.probability.value = 100;
				item.deal_status.value = 3;
				item.deal_status.lookup_value = 'Closed';
			}
	
			//lost
			if (field.value == 5) {
				item.probability.value = 0;
				item.deal_status.value = 3;
				item.deal_status.lookup_value = 'Closed';
			}
		}
	}
	
	function on_edit_form_shown(item) {
		item.edit_form.find('input.deal_value, input.deal_products_sum, input.deal_products_count').width(150);
		item.edit_form.find('input.probability').width(50);
		item.edit_form.find('input.stage, input.deal_status').parent().width(200);
		item.edit_form.find('input.expected_close_date').parent().width(150);
		item.edit_form.find('input.title').css('font-weight', 'bold');
	
		
		let deal_value = item.deal_value.value,
			products_sold = item.deal_products_sum.value || 0,
			deal_progress = 0;
	
		deal_progress = item.round(products_sold/deal_value * 100, 2);
	
		/*if (!item.master) {
		var $first_band = item.edit_form.find('form').eq(0);
			$first_band.wrap('<fieldset class="border p-2 rounded"></fieldset>');
			$first_band.before('<legend class="float-none px-2 fs-6" style="width: auto !important">Deal info</legend>');
	
		var $second_band = $('form').eq(1);
			$second_band.wrap('<fieldset class="border p-2 rounded mt-2"></fieldset>');
			$second_band.before('<legend class="float-none px-2 fs-6" style="width: auto !important";>Deal products info</legend>');
	
		$second_band.append('<div class="mb-2 row"><div class="overflow-hidden md:col-3">'+
			'<label class="form-label input-centered-label test" for="test">'+
			'Deal progress</label></div><div class="md:col-9"><input type="text" class="form-control test-input" id="test" disabled="" placeholder="" style="width: 180px;" value=' + deal_progress+ '></div></div>');
		}*/
	}
	
	function on_field_get_text(field) {
		if (field.field_name === 'probability') {
			return field.value + ' %';
		}
	}
	
	function on_field_get_html(field) {
		if (field.field_name === 'title') {
			return '<span class="badge text-wrap" style="font-size: 12px; background-color: #7890ED !important;">' + field.display_text + '</span>';
		}
	
		if (field.field_name === 'stage') {
	
			if (field.value == 1) {
				return '<span class="badge text-wrap" style="font-size: 12px; background-color: #d1c6c6;">' + field.display_text + '</span>';
			}
	
			else if (field.value == 2) {
				return '<span class="badge text-wrap" style="font-size: 12px; background-color: #9b8b8b;">' + field.display_text + '</span>';
			}
	
			else if (field.value == 3) {
				return '<span class="badge text-wrap" style="font-size: 12px; background-color: #7890ED;">' + field.display_text + '</span>';
			}
	
			else if (field.value == 4) {
				return '<span class="badge bg-success text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
			}
	
			else {
				return '<span class="badge bg-danger text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
			}
		}
	}
	
	function on_view_form_created(item) {
		if (!item.master) {
			item.add_view_button('Deal analysis', {type: 'primary', image: 'bi bi-graph-up-arrow'}).click(function() {
				create_d_pivot(item);
			});
	
			item.add_view_button('Kanban by STATUS', {type: 'primary', image: 'bi bi-kanban'}).click(function() {
				kanban_by_status(item);
			});
			
			item.add_view_button('Kanban by STAGE', {type: 'primary', image: 'bi bi-kanban'}).click(function() {
				kanban_by_stage(item);
			});
		}   else {
			item.view_form.find('#new-btn').hide();
		}
	}
	
	function create_d_pivot(item) {
		const pivot_table = task.data_analysis.copy();
			pivot_table.view(task.forms_container);
	
			const pivotContainer = pivot_table.view_form.find('#pivot_table');
			item.server('get_deals_pivot_data', function(data, error) {
				if (error) {
					item.warning(error);
				}   else {
					const myPivot = new JamDataPivot(pivotContainer, {
						data: data,
						/*fields: [
							{ name: 'region', label: 'Sales Region', type: 'string' },
							{ name: 'category', label: 'Product Category', type: 'string' },
							{ 
							name: 'sales', 
							label: 'Revenue ($)', 
							type: 'number',
							formatter: (val) => '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2 })
							},
							{ 
							name: 'margin', 
							label: 'Profit Margin ($)', 
							type: 'number',
							formatter: (val) => '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2 })
							}
						],*/
						groupBy: 'sales_rep',
						aggFunc: 'SUM',
						aggField: 'deal_value',
						showMetricCards: true,
						enableSearch: true,
						enableExport: true,
						theme: 'dark',
						onCellClick: function(result) {
							console.log('User clicked row:', result.groupValue, 'Raw items count:', result.count);
						},
						onDrilldownToggle: function(groupName, isExpanded) {
							console.log(`Group "${groupName}" drilldown is now ${isExpanded ? 'Expanded' : 'Collapsed'}`);
						}
					});
					}
			});
	}
	
	function kanban_by_status(item) {
		let kanban_board =  task.kanban_board.copy(),
			kanban_project,
			kanban_element_div;
			
			kanban_board.view_options.title = 'Kanban - Deals by status';
			kanban_board.view_options.width = 1800;
			kanban_board.view(task.forms_container);
			
			kanban_element_div = 'kanban_element_div_' + Date.now();
			kanban_board.view_form.find('.kanban_board_div').prop('id', kanban_element_div);
			
			kanban_board.server('kanban_deals_by_status', function(data, error) {
				if (error) {
					item.warning(error);
				}   else {
						kanban_project = new KanbanBoard('#' + kanban_element_div, {
						width: '100%',
						theme: 'dark',
						titles: ['Active', 'On hold', 'Closed'],
						colours: ['#899499','#7393B3','#66CDAA', '#0096FF'],
						items: data,
						onBeforeDrag: (item, event) => {
						},
						onChange: (el, sourceBlock, targetBlock) => {
							//console.log(el.itemKanban.title);
						},
						onReceive: (el, targetBlock) => {
							let deals = task.deals.copy();
								deals.set_where({id: parseInt(el.itemKanban.id)});
								deals.open();
	
								deals.edit();
								deals.ticket_status.value = get_ticket_status(targetBlock.block);
								deals.apply();
						},
						onRightClick: (el, event) => {
						},
						onDblClick: (el, event) => {
							let deals = task.deals.copy();
								deals.set_where({id: parseInt(el.itemKanban.id)});
								deals.open();
	
								deals.edit_record();
								
								/*projects.on_after_apply = function(t) {
									kanban_project.updateItem(el.itemKanban.id, {
										title: t.title.value,
										block: t.ticket_status.display_text,
									}); 
								};*/
						},
						onRemove: (id, data) => {
						}
					});
				}
	
				kanban_board.view_form.find('#kanban_search').on('input', function() {
					const searchString = event.target.value;
						kanban_project.filterItems(searchString);
				});
	
				kanban_board.view_form.find('#refresh_kanban_btn').on('click', function() {
					kanban_board.server('kanban_deals_by_status', function(data, error) {
						if (error) {
							item.warning(error);
						}
						else {
							kanban_project.refreshItems(data);
						}
					});
				});
			});
	}
	
	function kanban_by_stage(item) {
		let kanban_board =  task.kanban_board.copy(),
			kanban_project,
			kanban_element_div;
			
			kanban_board.view_options.title = 'Kanban - Deals by status';
			kanban_board.view_options.width = 1800;
			kanban_board.view(task.forms_container);
			
			kanban_element_div = 'kanban_element_div_' + Date.now();
			kanban_board.view_form.find('.kanban_board_div').prop('id', kanban_element_div);
			
			kanban_board.server('kanban_deals_by_stage', function(data, error) {
				if (error) {
					item.warning(error);
				}   else {
						kanban_project = new KanbanBoard('#' + kanban_element_div, {
						width: '100%',
						theme: 'dark',
						titles: ['Prospect', 'Value Prop', 'Proposal', 'Won', 'Lost'],
						colours: ['#899499','#7393B3','#66CDAA', '#0096FF'],
						items: data,
						onBeforeDrag: (item, event) => {
						},
						onChange: (el, sourceBlock, targetBlock) => {
							//console.log(el.itemKanban.title);
						},
						onReceive: (el, targetBlock) => {
							let deals = task.deals.copy();
								deals.set_where({id: parseInt(el.itemKanban.id)});
								deals.open();
	
								deals.edit();
								deals.ticket_status.value = get_ticket_status(targetBlock.block);
								deals.apply();
						},
						onRightClick: (el, event) => {
						},
						onDblClick: (el, event) => {
							let deals = task.deals.copy();
								deals.set_where({id: parseInt(el.itemKanban.id)});
								deals.open();
	
								deals.edit_record();
								
								/*projects.on_after_apply = function(t) {
									kanban_project.updateItem(el.itemKanban.id, {
										title: t.title.value,
										block: t.ticket_status.display_text,
									}); 
								};*/
						},
						onRemove: (id, data) => {
						}
					});
				}
	
				kanban_board.view_form.find('#kanban_search').on('input', function() {
					const searchString = event.target.value;
						kanban_project.filterItems(searchString);
				});
	
				kanban_board.view_form.find('#refresh_kanban_btn').on('click', function() {
					kanban_board.server('kanban_deals_by_stage', function(data, error) {
						if (error) {
							item.warning(error);
						}
						else {
							kanban_project.refreshItems(data);
						}
					});
				});
			});
	}
	
	
	function get_ticket_status(status_text) {
		const ticket_statuset_list= task.lookup_lists[5];
		const matchedSublist = ticket_statuset_list.find(sublist => sublist[1] === status_text);
		
		return matchedSublist ? matchedSublist[0] : null;
	}
	this.on_field_select_value = on_field_select_value;
	this.on_edit_form_created = on_edit_form_created;
	this.on_field_changed = on_field_changed;
	this.on_edit_form_shown = on_edit_form_shown;
	this.on_field_get_text = on_field_get_text;
	this.on_field_get_html = on_field_get_html;
	this.on_view_form_created = on_view_form_created;
	this.create_d_pivot = create_d_pivot;
	this.kanban_by_status = kanban_by_status;
	this.kanban_by_stage = kanban_by_stage;
	this.get_ticket_status = get_ticket_status;
}

task.events.events8 = new Events8();

function Events9() { // crm_app.catalogs.products 

	function on_edit_form_shown(item) {
		item.edit_form.find('input.unit_price').width(120);
	}
	
	function on_field_get_html(field) {
		if (field.field_name === 'sku') {
			return '<span class="badge bg-success text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
		}
	
		if (field.field_name === 'name') {
			return '<span class="badge bg-primary text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
		}
	
		if (field.field_name === 'is_recurring') {
			if (field.value === true) {
				return '<i class="bi bi-toggle-on fs-5"></i>';
			}   else {
				return '<i class="bi bi-toggle-off fs-5"></i>';
			}
		}
	}
	
	function on_edit_form_created(item) {
		if (item.is_new()) {
			item.edit_options.title = 'New product';
		}   else {
			item.edit_options.title = 'Product #' + item.id.value;
		}
	}
	this.on_edit_form_shown = on_edit_form_shown;
	this.on_field_get_html = on_field_get_html;
	this.on_edit_form_created = on_edit_form_created;
}

task.events.events9 = new Events9();

function Events10() { // crm_app.journals.deal_products 

	let product_price = 0;
	
	function on_edit_form_created(item) {
		item.deal_id.read_only = true;
		item.edit_options.label_on_top = true;
	
		if (item.master) {
			item.deal_id.lookup_value = item.master.title.value;
		}
	
		if (item.is_new()) {
			item.edit_options.title = 'New deal product';
		}   else {
			item.edit_options.title = 'Deal product';
	
			if (item.product_id.value) {
				item.quantity.read_only = true;
			}   else {
				item.quantity.read_only = false;
			}
		}
	
		item.product_id.enable_typeahead = true;
		//item.product_id.lookup_search_fields = ['id', 'name', 'unit_price'];
		item.product_id.lookup_search_fields = ['id', 'name'];
	
	}
	
	function on_edit_form_shown(item) {
		item.edit_form.find('input.discount_percent, input.line_total, input.quantity').width(100);
		item.edit_form.find('.product_id').focus();
	}
	
	function on_field_changed(field, lookup_item) {
		const item = field.owner;
	
		if (field.field_name === 'product_id' && lookup_item) {
			if (field.value) {
				item.product_id.lookup_value = lookup_item.name.value;
				product_price = lookup_item.unit_price.value;
				item.line_total.value = lookup_item.unit_price.value;
				item.edit_form.find('.quantity').focus();
			}
		}
	
		if (field.field_name === 'quantity') {
			item.line_total.value = field.value * product_price - ((field.value * product_price)*item.discount_percent.value/100);
		}
	
		if (field.field_name === 'discount_percent' && field.value) {
			item.line_total.value = item.line_total.value - (item.line_total.value * field.value/100);
		}
	}
	
	function on_edit_form_closed(item) {
		product_price = 0;
	}
	
	function on_field_get_html(field) {
		if (field.field_name === 'product_id') {
			return '<span class="badge bg-info text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
		}
	}
	
	function on_before_field_changed(field) {
		let item = field.owner;
	
		if (field.field_name === 'product_id') {
			if (field.value == null) {
				item.quantity.read_only = false;
				product_price = 0;
				item.quantity.value = 0;
				item.discount_percent.value = 0;
				item.line_total.value = 0.0;
			}
		}
	}
	
	function on_view_form_created(item) {
		/*if (!item.master) {
			item.view_form.find('#new-btn').hide();
		}*/
	
		if (!item.master) {
			item.add_view_button('Deal products analysis', {type: 'primary', image: 'bi bi-graph-up-arrow'}).click(function() {
				create_dp_pivot(item);
			});
		}   else {
			item.view_form.find('#new-btn').hide();
		}
	}
	
	function create_dp_pivot(item) {
		const pivot_table = task.data_analysis.copy();
			pivot_table.view(task.forms_container);
	
			const pivotContainer = pivot_table.view_form.find('#pivot_table');
			item.server('get_products_pivot_data', function(data, error) {
				if (error) {
					item.warning(error);
				}   else {
					const myPivot = new JamDataPivot(pivotContainer, {
						data: data,
						/*fields: [
							{ name: 'region', label: 'Sales Region', type: 'string' },
							{ name: 'category', label: 'Product Category', type: 'string' },
							{ 
							name: 'sales', 
							label: 'Revenue ($)', 
							type: 'number',
							formatter: (val) => '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2 })
							},
							{ 
							name: 'margin', 
							label: 'Profit Margin ($)', 
							type: 'number',
							formatter: (val) => '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2 })
							}
						],*/
						groupBy: 'product',
						aggFunc: 'SUM',
						aggField: 'line_total',
						showMetricCards: true,
						enableSearch: true,
						enableExport: true,
						theme: 'dark',
						onCellClick: function(result) {
							console.log('User clicked row:', result.groupValue, 'Raw items count:', result.count);
						},
						onDrilldownToggle: function(groupName, isExpanded) {
							console.log(`Group "${groupName}" drilldown is now ${isExpanded ? 'Expanded' : 'Collapsed'}`);
						}
					});
					}
			});
	}
	this.on_edit_form_created = on_edit_form_created;
	this.on_edit_form_shown = on_edit_form_shown;
	this.on_field_changed = on_field_changed;
	this.on_edit_form_closed = on_edit_form_closed;
	this.on_field_get_html = on_field_get_html;
	this.on_before_field_changed = on_before_field_changed;
	this.on_view_form_created = on_view_form_created;
	this.create_dp_pivot = create_dp_pivot;
}

task.events.events10 = new Events10();

function Events11() { // crm_app.journals.activities 

	function on_edit_form_created(item) {
		item.deal_id.read_only = true;
	
		if (item.master) {
			item.deal_id.lookup_value = item.master.title.value;
		}
	
		if (item.is_new()) {
			item.edit_options.title = 'New activity';
		}   else {
			item.edit_options.title = 'Activity #' + item.id.value;
		}
	
		item.contact_id.enable_typeahead = true;
		item.contact_id.lookup_search_fields = ['id', 'email'];
	}
	
	function on_field_select_value(field, lookup_item) {
		const item = field.owner;
	
		if (field.field_name === 'contact_id' && lookup_item) {
			lookup_item.set_where({company_id: item.master.company_id.value});
		}
	}
	
	function on_field_changed(field, lookup_item) {
		const item = field.owner;
	
		if (field.field_name === 'contact_id' && lookup_item) {
			if (field.value) {
				item.contact_id.lookup_value = lookup_item.email.value;
				item.edit_form.find('.activity_type').focus();
			}
		}
	}
	
	function on_before_post(item) {
		item.updated.value = new Date();
	}
	
	function on_field_get_html(field) {
		if (field.field_name === 'contact_id') {
			return '<span class="badge bg-success text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
		}
	
		if (field.field_name === 'activity_type') {
			return '<span class="badge bg-primary text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
		}
	}
	
	function on_view_form_created(item) {
		if (!item.master) {
			item.view_form.find('#new-btn').hide();
		}
	}
	this.on_edit_form_created = on_edit_form_created;
	this.on_field_select_value = on_field_select_value;
	this.on_field_changed = on_field_changed;
	this.on_before_post = on_before_post;
	this.on_field_get_html = on_field_get_html;
	this.on_view_form_created = on_view_form_created;
}

task.events.events11 = new Events11();

function Events13() { // crm_app.journals.companies.deals 

	function on_field_select_value(field, lookup_item) {
		const item = field.owner;
	
		if (field.field_name === 'contact_id' && lookup_item) {
			lookup_item.set_where({company_id: item.company_id.value});
		}
	}
	
	function on_edit_form_created(item) {
		if (item.is_new()) {
			item.edit_options.title = 'New deeal';
			item.contact_id.read_only = true;
	
			if (item.master) {
				item.company_id.lookup_value = item.master.name.value;
			}
		}   else {
			item.edit_options.title = 'Deal #' + item.id.value;
	
			if (item.master) {
				item.company_id.read_only = true;
				item.company_id.lookup_value = item.master.name.value;
			}
		}
	
		item.company_id.enable_typeahead = true;
		item.company_id.lookup_search_fields = ['name', 'industry'];
	
		item.contact_id.enable_typeahead = true;
		item.contact_id.lookup_search_fields = ['email', 'first_name', 'last_name'];
	
		item.create_inputs(item.edit_form.find("#deal-info"), {
			fields: ['title', 'company_id', 'company_id', 'stage', 'deal_value', 'expected_close_date', 'probability', 'deal_status'],
			in_well: false,
		});
	
		item.create_inputs(item.edit_form.find("#deal-progress"), {
			fields: ['deal_products_sum', 'deal_products_count', 'id', 'company_annual_revenue'],
			in_well: false,
		});
	}
	
	function on_field_changed(field, lookup_item) {
		const item = field.owner;
	
		if (field.field_name === 'company_id') {
			if (field.value) {
				item.contact_id.read_only = false;
			}   
			
			else if (field.value == null) {
				item.contact_id.value = null;
				item.contact_id.read_only = true;
			}
		}
	
		if (field.field_name === 'stage') {
			//won
			if (field.value == 4) {
				item.probability.value = 100;
				item.deal_status.value = 3;
				item.deal_status.lookup_value = 'Closed';
			}
	
			//lost
			if (field.value == 5) {
				item.probability.value = 0;
				item.deal_status.value = 3;
				item.deal_status.lookup_value = 'Closed';
			}
		}
	}
	
	function on_edit_form_shown(item) {
		item.edit_form.find('input.deal_value, input.deal_products_sum, input.deal_products_count').width(150);
		item.edit_form.find('input.probability').width(50);
		item.edit_form.find('input.stage, input.deal_status').parent().width(200);
		item.edit_form.find('input.expected_close_date').parent().width(150);
		item.edit_form.find('input.title').css('font-weight', 'bold');
	
		
		let deal_value = item.deal_value.value,
			products_sold = item.deal_products_sum.value || 0,
			deal_progress = 0;
	
		deal_progress = item.round(products_sold/deal_value * 100, 2);
	
		/*if (!item.master) {
		var $first_band = item.edit_form.find('form').eq(0);
			$first_band.wrap('<fieldset class="border p-2 rounded"></fieldset>');
			$first_band.before('<legend class="float-none px-2 fs-6" style="width: auto !important">Deal info</legend>');
	
		var $second_band = $('form').eq(1);
			$second_band.wrap('<fieldset class="border p-2 rounded mt-2"></fieldset>');
			$second_band.before('<legend class="float-none px-2 fs-6" style="width: auto !important";>Deal products info</legend>');
	
		$second_band.append('<div class="mb-2 row"><div class="overflow-hidden md:col-3">'+
			'<label class="form-label input-centered-label test" for="test">'+
			'Deal progress</label></div><div class="md:col-9"><input type="text" class="form-control test-input" id="test" disabled="" placeholder="" style="width: 180px;" value=' + deal_progress+ '></div></div>');
		}*/
	}
	
	function on_field_get_text(field) {
		if (field.field_name === 'probability') {
			return field.value + ' %';
		}
	}
	
	function on_field_get_html(field) {
		if (field.field_name === 'title') {
			return '<span class="badge text-wrap" style="font-size: 12px; background-color: #7890ED !important;">' + field.display_text + '</span>';
		}
	
		if (field.field_name === 'stage') {
	
			if (field.value == 1) {
				return '<span class="badge text-wrap" style="font-size: 12px; background-color: #d1c6c6;">' + field.display_text + '</span>';
			}
	
			else if (field.value == 2) {
				return '<span class="badge text-wrap" style="font-size: 12px; background-color: #9b8b8b;">' + field.display_text + '</span>';
			}
	
			else if (field.value == 3) {
				return '<span class="badge text-wrap" style="font-size: 12px; background-color: #7890ED;">' + field.display_text + '</span>';
			}
	
			else if (field.value == 4) {
				return '<span class="badge bg-success text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
			}
	
			else {
				return '<span class="badge bg-danger text-wrap" style="font-size: 12px;">' + field.display_text + '</span>';
			}
		}
	}
	
	function on_view_form_created(item) {
		if (!item.master) {
			item.add_view_button('Deal analysis', {type: 'primary', image: 'bi bi-graph-up-arrow'}).click(function() {
				create_d_pivot(item);
			});
	
			item.add_view_button('Kanban by STATUS', {type: 'primary', image: 'bi bi-kanban'}).click(function() {
				kanban_by_status(item);
			});
			
			item.add_view_button('Kanban by STAGE', {type: 'primary', image: 'bi bi-kanban'}).click(function() {
				kanban_by_stage(item);
			});
		}   else {
			item.view_form.find('#new-btn').hide();
		}
	}
	
	function create_d_pivot(item) {
		const pivot_table = task.data_analysis.copy();
			pivot_table.view(task.forms_container);
	
			const pivotContainer = pivot_table.view_form.find('#pivot_table');
			item.server('get_deals_pivot_data', function(data, error) {
				if (error) {
					item.warning(error);
				}   else {
					const myPivot = new JamDataPivot(pivotContainer, {
						data: data,
						/*fields: [
							{ name: 'region', label: 'Sales Region', type: 'string' },
							{ name: 'category', label: 'Product Category', type: 'string' },
							{ 
							name: 'sales', 
							label: 'Revenue ($)', 
							type: 'number',
							formatter: (val) => '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2 })
							},
							{ 
							name: 'margin', 
							label: 'Profit Margin ($)', 
							type: 'number',
							formatter: (val) => '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2 })
							}
						],*/
						groupBy: 'sales_rep',
						aggFunc: 'SUM',
						aggField: 'deal_value',
						showMetricCards: true,
						enableSearch: true,
						enableExport: true,
						theme: 'light',
						onCellClick: function(result) {
							console.log('User clicked row:', result.groupValue, 'Raw items count:', result.count);
						},
						onDrilldownToggle: function(groupName, isExpanded) {
							console.log(`Group "${groupName}" drilldown is now ${isExpanded ? 'Expanded' : 'Collapsed'}`);
						}
					});
					}
			});
	}
	
	function kanban_by_status(item) {
		let kanban_board =  task.kanban_board.copy(),
			kanban_project,
			kanban_element_div;
			
			kanban_board.view_options.title = 'Kanban - Deals by status';
			kanban_board.view_options.width = 1800;
			kanban_board.view(task.forms_container);
			
			kanban_element_div = 'kanban_element_div_' + Date.now();
			kanban_board.view_form.find('.kanban_board_div').prop('id', kanban_element_div);
			
			kanban_board.server('kanban_deals_by_status', function(data, error) {
				if (error) {
					item.warning(error);
				}   else {
						kanban_project = new KanbanBoard('#' + kanban_element_div, {
						width: '100%',
						theme: 'light',
						titles: ['Active', 'On hold', 'Closed'],
						colours: ['#899499','#7393B3','#66CDAA', '#0096FF'],
						items: data,
						onBeforeDrag: (item, event) => {
						},
						onChange: (el, sourceBlock, targetBlock) => {
							//console.log(el.itemKanban.title);
						},
						onReceive: (el, targetBlock) => {
							let deals = task.deals.copy();
								deals.set_where({id: parseInt(el.itemKanban.id)});
								deals.open();
	
								deals.edit();
								deals.ticket_status.value = get_ticket_status(targetBlock.block);
								deals.apply();
						},
						onRightClick: (el, event) => {
						},
						onDblClick: (el, event) => {
							let deals = task.deals.copy();
								deals.set_where({id: parseInt(el.itemKanban.id)});
								deals.open();
	
								deals.edit_record();
								
								/*projects.on_after_apply = function(t) {
									kanban_project.updateItem(el.itemKanban.id, {
										title: t.title.value,
										block: t.ticket_status.display_text,
									}); 
								};*/
						},
						onRemove: (id, data) => {
						}
					});
				}
	
				kanban_board.view_form.find('#kanban_search').on('input', function() {
					const searchString = event.target.value;
						kanban_project.filterItems(searchString);
				});
	
				kanban_board.view_form.find('#refresh_kanban_btn').on('click', function() {
					kanban_board.server('kanban_deals_by_status', function(data, error) {
						if (error) {
							item.warning(error);
						}
						else {
							kanban_project.refreshItems(data);
						}
					});
				});
			});
	}
	
	function kanban_by_stage(item) {
		let kanban_board =  task.kanban_board.copy(),
			kanban_project,
			kanban_element_div;
			
			kanban_board.view_options.title = 'Kanban - Deals by status';
			kanban_board.view_options.width = 1800;
			kanban_board.view(task.forms_container);
			
			kanban_element_div = 'kanban_element_div_' + Date.now();
			kanban_board.view_form.find('.kanban_board_div').prop('id', kanban_element_div);
			
			kanban_board.server('kanban_deals_by_stage', function(data, error) {
				if (error) {
					item.warning(error);
				}   else {
						kanban_project = new KanbanBoard('#' + kanban_element_div, {
						width: '100%',
						theme: 'light',
						titles: ['Prospect', 'Value Prop', 'Proposal', 'Won', 'Lost'],
						colours: ['#899499','#7393B3','#66CDAA', '#0096FF'],
						items: data,
						onBeforeDrag: (item, event) => {
						},
						onChange: (el, sourceBlock, targetBlock) => {
							//console.log(el.itemKanban.title);
						},
						onReceive: (el, targetBlock) => {
							let deals = task.deals.copy();
								deals.set_where({id: parseInt(el.itemKanban.id)});
								deals.open();
	
								deals.edit();
								deals.ticket_status.value = get_ticket_status(targetBlock.block);
								deals.apply();
						},
						onRightClick: (el, event) => {
						},
						onDblClick: (el, event) => {
							let deals = task.deals.copy();
								deals.set_where({id: parseInt(el.itemKanban.id)});
								deals.open();
	
								deals.edit_record();
								
								/*projects.on_after_apply = function(t) {
									kanban_project.updateItem(el.itemKanban.id, {
										title: t.title.value,
										block: t.ticket_status.display_text,
									}); 
								};*/
						},
						onRemove: (id, data) => {
						}
					});
				}
	
				kanban_board.view_form.find('#kanban_search').on('input', function() {
					const searchString = event.target.value;
						kanban_project.filterItems(searchString);
				});
	
				kanban_board.view_form.find('#refresh_kanban_btn').on('click', function() {
					kanban_board.server('kanban_deals_by_stage', function(data, error) {
						if (error) {
							item.warning(error);
						}
						else {
							kanban_project.refreshItems(data);
						}
					});
				});
			});
	}
	
	
	function get_ticket_status(status_text) {
		const ticket_statuset_list= task.lookup_lists[5];
		const matchedSublist = ticket_statuset_list.find(sublist => sublist[1] === status_text);
		
		return matchedSublist ? matchedSublist[0] : null;
	}
}

task.events.events13 = new Events13();

function Events18() { // crm_app.journals.dashboard 

	let dealsEstimatedSum = 0;
	
	function on_view_form_created(item) {
		loadCustomerMetrics(item);
		loadProductsMetrics(item);
		calculateKpiMetrics(item);
		loadContactMetrics(item);
		loadTopDealsTable(item);
		loadActivitiesFeed(item);
	}
	
	function loadCustomerMetrics(item) {
		var companies = task.companies.copy();
			companies.open({fields: ['deals_estimated_sum'], funcs: {'deals_estimated_sum': 'sum'}});
	
			if (companies.rec_count) {
				dealsEstimatedSum = 1744900;	//companies.deals_estimated_sum.value;
				item.view_form.find('#dash-total-companies').text(companies.record_count());
			}
	}
	
	function loadProductsMetrics(item) {
		const products = task.products.copy();
			products.open();
	
			if (products.rec_count) {
				item.view_form.find('#dash-total-products').text(products.rec_count);
			}
	}
	
	function calculateKpiMetrics(item) {
		var deals = task.deals.copy();
		
		deals.open({fields: ['stage', 'deal_value', 'probability', 'deal_status']}, function() {
			var totalWonRevenue = 0;
			var weightedPipeline = 0;
			var activeDealsCount = 0;
			var totalWonCount = 0;
			var totalClosedCount = 0;
			
			deals.each(function(d) {
				var val = d.deal_value.value || 0;
				var prob = d.probability.value || 0;
				var stage = d.stage.value;
				var status = d.deal_status.value;
				
				// Won Revenue
				if (stage == 4) {
					totalWonRevenue += val;
					totalWonCount++;
				}
				
				// Active Deals & Weighted Pipeline (Value * Probability)
				if (status == 1) {
					activeDealsCount ++;
					weightedPipeline += (val * (prob / 100));
				}
				
				// Track total closed for win rate calculation
				if (status == 3) {
					totalClosedCount++;
				}
			});
	
			var totalPotentialForecast = totalWonRevenue + weightedPipeline;
			var realizationRate = totalPotentialForecast > 0 ? Math.round((totalWonRevenue / totalPotentialForecast) * 100) : 0;
			
			var winRate = totalClosedCount > 0 ? Math.round((totalWonCount / totalClosedCount) * 100) : 0;
			
			item.view_form.find('#dash-total-revenue').text('$' + totalWonRevenue.toLocaleString('en-US', {minimumFractionDigits: 2}));
			item.view_form.find('#dash-weighted-pipeline').text('$' + weightedPipeline.toLocaleString('en-US', {minimumFractionDigits: 2}));
			
			
			item.view_form.find('#dash-forecast-realization').text(realizationRate + '%');
			item.view_form.find('#dash-realization-bar').css('width', realizationRate + '%');
	
			item.view_form.find('#dash-win-rate').text(winRate + '%');
			item.view_form.find('#dash-win-rate-bar').css('width', winRate + '%');
			item.view_form.find('#dash-total-revenue-bar').css('width', (weightedPipeline/dealsEstimatedSum * 100) + '%');
			item.view_form.find('#dash-weighted-pipeline-bar').css('width', (weightedPipeline/dealsEstimatedSum * 100) + '%');
			$('#dash-active-deals').text(activeDealsCount);
		});
	}
	
	
	
	function loadContactMetrics(item) {
		var contacts = task.contacts.copy();
		
		contacts.open({fields: ['id']}, function() {
			item.view_form.find('#dash-total-contacts').text(contacts.record_count());
		});
	}
	
	function loadTopDealsTable(item) {
		var deals = task.deals.copy();
		
		deals.set_where({deal_status: 1});
		deals.set_order_by(['-deal_value']);
		
		deals.open({limit: 5}, function() {
			var tbody = item.view_form.find('#dash-deals-table-body');
			tbody.empty();
			
			if (deals.record_count() === 0) {
				tbody.html('<tr><td colspan="5" class="text-center text-muted py-3">No active deals found</td></tr>');
				return;
			}
			
			deals.each(function(d) {
				var badgeClass = 'bg-primary';
				if (d.stage.value === 'Proposal') badgeClass = 'bg-info';
				if (d.stage.value === 'Value Prop') badgeClass = 'bg-warning text-dark';
				if (d.stage.value === 'Prospect') badgeClass = 'bg-secondary';
				
				var row = '<tr>' +
					'<td class="ps-3 fw-semibold text-dark">' + d.title.value + '</td>' +
					'<td><span class="badge bg-opacity-10 text-dark ' + badgeClass + ' px-2 py-1">' + d.stage.display_text + '</span></td>' +
					'<td class="fw-bold text-dark">$' + (d.deal_value.value || 0).toLocaleString('en-US') + '</td>' +
					'<td>' +
						'<div class="d-flex align-items-center">' +
							'<span class="me-2 small">' + d.probability.value + '%</span>' +
							'<div class="progress w-100" style="height: 6px;">' +
								'<div class="progress-bar bg-success" style="width: ' + d.probability.value + '%"></div>' +
							'</div>' +
						'</div>' +
					'</td>' +
					'<td class="pe-3 text-muted small">' + (d.expected_close_date.display_text || 'N/A') + '</td>' +
				'</tr>';
				
				tbody.append(row);
			});
		});
	}
	
	function loadActivitiesFeed(item) {
		var activities = task.activities.copy();
		
		activities.set_order_by(['-due_date']);
		
		activities.open({limit: 5}, function() {
			var list = item.view_form.find('#dash-activities-list');
			list.empty();
			
			if (activities.record_count() === 0) {
				list.html('<li class="list-group-item border-0 text-center text-muted">No recent activities</li>');
				return;
			}
			
			activities.each(function(act) {
				var icon = 'bi-chat-left-text text-primary';
				if (act.activity_type.value == 1) icon = 'bi-telephone text-success';
				if (act.activity_type.value == 2) icon = 'bi-people text-info';
				if (act.activity_type.value == 4) icon = 'bi-geo-alt text-warning';
				
				var statusBadge = act.is_completed.value ? 
					'<span class="badge bg-success bg-opacity-10 text-success ms-auto">Done</span>' : 
					'<span class="badge bg-danger bg-opacity-10 text-danger ms-auto">Pending</span>';
					
				var itemHtml = '<li class="list-group-item border-0 border-bottom border-light px-0 py-2 d-flex align-items-start">' +
					'<div class="me-3 mt-1 fs-5"><i class="bi ' + icon + '"></i></div>' +
					'<div class="me-2">' +
						'<div class="fw-semibold text-dark fs-7">' + act.activity_type.display_text + '</div>' +
						'<div class="text-muted small text-truncate" style="max-width: 200px;">' + (act.notes.value || '') + '</div>' +
					'</div>' +
					statusBadge +
				'</li>';
				
				list.append(itemHtml);
			});
		});
	}
	this.on_view_form_created = on_view_form_created;
	this.loadCustomerMetrics = loadCustomerMetrics;
	this.loadProductsMetrics = loadProductsMetrics;
	this.calculateKpiMetrics = calculateKpiMetrics;
	this.loadContactMetrics = loadContactMetrics;
	this.loadTopDealsTable = loadTopDealsTable;
	this.loadActivitiesFeed = loadActivitiesFeed;
}

task.events.events18 = new Events18();

})(jQuery, task)