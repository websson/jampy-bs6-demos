const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('table.js', 'utf8');

// Method groups
const groups = {
    'table-init.js': ['init', 'init_options', 'init_fields', 'editable_fields', 'init_selections', 'init_selected_field', 'init_search_inputs', 'initKeyboardEvents', 'init_table', 'form_closing', 'do_after_open'],
    'table-lifecycle.js': ['destroy', 'resize'],
    'table-creation.js': ['create_table', 'create_pager', 'create_freezed_table', 'delete_freezed_table', 'create_search_input_form'],
    'table-rendering.js': ['fill_title', 'fill_footer', 'fill_datasource', 'fill_rows', 'new_row', 'new_column', 'refresh', 'build', 'show_footer', 'hideFooter'],
    'table-sync.js': ['sync_freezed', '_sync_freezed_impl', 'syncronize', 'syncronize_tables', 'cancel_sync', 'resume_sync', 'set_sync'],
    'table-selection.js': ['show_selection', 'hide_selection', 'select_row', 'selections_update_selected', 'selections_get_selected', 'selections_can_change', 'selections_set_selected', 'selections_get_all_selected', 'selections_set_all_selected_ex', 'selections_set_all_selected'],
    'table-editing.js': ['show_editor', 'hide_editor', 'close_editor', 'flush_editor', 'can_edit', 'do_on_edit'],
    'table-field.js': ['get_field_text', 'get_field_html', 'update_field', 'each_field', 'get_freezed_fields', 'set_selected_field', 'next_field', 'prior_field'],
    'table-scrolling.js': ['scroll', 'scroll_table', 'scroll_datasource', 'scroll_height', 'scroll_pos_by_rec'],
    'table-navigation.js': ['next_record', 'prior_record', 'show_next_record', 'show_prior_record', 'first_page', 'next_page', 'prior_page', 'last_page'],
    'table-pagination.js': ['update_page_info', 'update_totals', 'update_page_count', 'set_page_number', 'reload'],
    'table-summary.js': ['calc_summary', 'update_summary'],
    'table-column.js': ['change_field_width', 'get_cell_width', 'set_сell_width', 'sync_col_width', 'get_element_width', 'remove_saved_width', 'set_saved_width'],
    'table-search.js': ['hide_search_inputs', 'hide_search_input_form'],
    'table-keyboard.js': ['keydown', 'keyup', 'keypress'],
    'table-row.js': ['row_by_record', 'record_by_row', 'refresh_row', 'update_selected', 'clicked', 'table_focused'],
    'table-utils.js': ['height', 'calculate', 'calc_row_count', 'calc_overlay_div_height', 'update_ellipse_btn', 'check_datasource', 'is_focused', 'focus', 'update']
};

function extractMethod(methodName) {
    if (methodName === 'editable_fields') {
        const match = content.match(/    get editable_fields\(\) \{[\s\S]*?\n     \}/);
        return match ? match[0] : null;
    }

    // Escape special chars
    const escaped = methodName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`    ${escaped}\\s*\\([^)]*\\)\\s*\\{`, 'g');
    const match = pattern.exec(content);

    if (!match) return null;

    let start = match.index;
    let braceCount = 0;
    let inMethod = false;

    for (let i = start; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            inMethod = true;
        } else if (content[i] === '}') {
            braceCount--;
            if (inMethod && braceCount === 0) {
                return content.substring(start, i + 1);
            }
        }
    }

    return null;
}

// Create table directory
if (!fs.existsSync('table')) {
    fs.mkdirSync('table');
}

// Process each group
for (const [filename, methods] of Object.entries(groups)) {
    const extracted = [];
    const missing = [];

    for (const method of methods) {
        const code = extractMethod(method);
        if (code) {
            extracted.push(code);
        } else {
            missing.push(method);
        }
    }

    if (extracted.length > 0) {
        const exportName = filename.replace('table-', '').replace('.js', '') + 'Methods';
        const fileContent = `export const ${exportName} = {\n${extracted.join(',\n\n')}\n};\n`;

        fs.writeFileSync(path.join('table', filename), fileContent);
        console.log(`✓ ${filename}: ${extracted.length} methods`);

        if (missing.length > 0) {
            console.log(`  Missing: ${missing.join(', ')}`);
        }
    }
}

console.log('\nDone!');
