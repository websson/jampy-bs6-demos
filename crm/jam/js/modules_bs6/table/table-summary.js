import consts from "../consts.js";
export const summaryMethods = {
	calc_summary(callback) {
		var self = this,
			i,
			copy,
			field_name,
			field,
			fields,
			count_field,
			sum_fields,
			count_fields,
			total_records = 0,
			funcs,
			params = {};

		if (!this.item._paginate || this.item.virtual_table) {
			this.item.calc_summary(this.item, undefined, undefined, this.options.summary_fields);
		}
		else {
			if (this.item.master) {
				copy = task.item_by_ID(this.item.prototype_ID).copy({handlers: false, details: false});
			}
			else {
				copy = this.item.copy({handlers: false, details: false});
			}

			count_field = copy._primary_key;
			fields = [];
			count_fields = [];
			sum_fields = [];
			funcs = {};

			// always request row count via COUNT(pk)
			sum_fields.push(count_field);
			funcs[count_field] = 'count';

			// set up aggregation funcs
			for (i = 0; i < this.options.summary_fields.length; i++) {
				field_name = this.options.summary_fields[i];
				field = this.item.field_by_name(field_name);
				if (field && this.fields.indexOf(field) !== -1) {
					fields.push(field_name);
					if (field.data_type === consts.BOOLEAN) {
						sum_fields.push(field_name);
						funcs[field_name] = 'sum'; // TRUE count
					}
					else if (field.numeric_field()) {
						sum_fields.push(field_name);
						funcs[field_name] = 'sum';
					}
					else {
						count_fields.push(field_name);
					}
				}
			}

			// copy params
			for (var key in self.item._open_params) {
				if (self.item._open_params.hasOwnProperty(key)) {
					if (key.substring(0, 2) !== '__') {
						params[key] = self.item._open_params[key];
					}
				}
			}
			params.__summary = true;
			if (self.item._open_params.__filters) {
				copy._where_list = self.item._open_params.__filters;
			}1
			if (this.item.master) {
				copy.ID = this.item.ID;
				params.__master_id = this.item.master.ID;
				params.__master_rec_id = this.item.master.field_by_name(this.item.master._primary_key).value;
			}

			this.item._fields_summary_info = {};
			copy.open({fields: sum_fields, funcs: funcs, params: params}, function() {

	//            copy.each_field(function(f, i) {
	//                console.log(i, f.field_name, f.data_type, f.value, f.display_text);
	//            });

				var counts = {};

				// collect all values
				copy.each_field(function(f) {
					counts[f.field_name] = f.value;
				});

				// get total row count safely from COUNT(pk)
				total_records = counts[count_field] || 0;

				// now build summaries
				copy.each_field(function(f) {
					if (f.field_name === count_field) {
						total_records = f.data; // COUNT(*)
					}
					else if (f.data_type === consts.BOOLEAN) {
						var true_count = f.data || 0;           // f.data has SUM(PAID)
						var false_count = total_records - true_count;
						self.item._fields_summary_info[f.field_name] = {
							text: true_count + ' ✓ / ' + false_count + ' ✗',
							value: true_count
						};
					}
					else if (f.numeric_field()) {
						self.item._fields_summary_info[f.field_name] = {
							text: f.display_text,
							value: f.value
						};
					}
				});


				// non-numeric, non-boolean fields → show row count
				for (i = 0; i < count_fields.length; i++) {
					self.item._fields_summary_info[count_fields[i]] = {
						text: total_records + '',
						value: total_records
					};
				}

				self.update_summary();
				if (callback) {
					callback.call(this, total_records);
				}
			});
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

    }
};
