export const BOARD_CONFIG_VERSION = 3;

const COLUMN_KINDS = new Set(['chars', 'time', 'word']);
const WINDOW_STRATEGIES = new Set(['nextByTime', 'static']);

export function normalizeBoardConfig(raw) {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return { schema_version: BOARD_CONFIG_VERSION, columns: [], presets: {}, rows: [], ui: {} };
	}
	return {
		schema_version: BOARD_CONFIG_VERSION,
		columns: Array.isArray(raw.columns) ? raw.columns : [],
		presets: (raw.presets && typeof raw.presets === 'object') ? raw.presets : {},
		rows: Array.isArray(raw.rows) ? raw.rows : [],
		ui: (raw.ui && typeof raw.ui === 'object') ? raw.ui : {}
	};
}

/**
 * Validate the public board configuration without changing or normalizing it.
 * The result is intentionally data-only so hosts can render errors themselves.
 */
export function validateBoardConfig(raw) {
	const errors = [];
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return { valid: false, errors: ['config must be an object'] };
	}

	if (raw.schema_version !== undefined && raw.schema_version !== BOARD_CONFIG_VERSION) {
		errors.push(`schema_version must be ${BOARD_CONFIG_VERSION}`);
	}
	if (!Array.isArray(raw.columns)) {
		errors.push('columns must be an array');
	} else {
		const keys = new Set();
		raw.columns.forEach((column, index) => {
			const path = `columns[${index}]`;
			if (!column || typeof column !== 'object' || Array.isArray(column)) {
				errors.push(`${path} must be an object`);
				return;
			}
			if (typeof column.key !== 'string' || !column.key) errors.push(`${path}.key must be a non-empty string`);
			else if (keys.has(column.key)) errors.push(`${path}.key must be unique`);
			else keys.add(column.key);
			if (!COLUMN_KINDS.has(column.kind)) errors.push(`${path}.kind must be chars, time, or word`);
			if (typeof column.sourceField !== 'string' || !column.sourceField) errors.push(`${path}.sourceField must be a non-empty string`);
			if (column.kind === 'chars' && column.unitCount !== undefined && (!Number.isInteger(column.unitCount) || column.unitCount < 1)) errors.push(`${path}.unitCount must be a positive integer`);
		});
	}
	if (raw.presets !== undefined) {
		if (!raw.presets || typeof raw.presets !== 'object' || Array.isArray(raw.presets)) {
			errors.push('presets must be an object');
		} else {
			Object.entries(raw.presets).forEach(([presetKey, presetList]) => {
				if (!Array.isArray(presetList)) {
					errors.push(`presets.${presetKey} must be an array`);
				} else {
					presetList.forEach((item, index) => {
						if (!item || typeof item !== 'object' || Array.isArray(item)) {
							errors.push(`presets.${presetKey}[${index}] must be an object`);
						}
					});
				}
			});
		}
	}
	if (raw.rows !== undefined && !Array.isArray(raw.rows)) errors.push('rows must be an array');
	const ui = raw.ui;
	if (ui !== undefined && (!ui || typeof ui !== 'object' || Array.isArray(ui))) errors.push('ui must be an object');
	
	const columnKeys = new Set();
	if (Array.isArray(raw.columns)) {
		raw.columns.forEach(col => {
			if (col && typeof col === 'object' && typeof col.key === 'string' && col.key) {
				columnKeys.add(col.key);
			}
		});
	}

	if (Array.isArray(raw.columns)) {
		const keys = new Set();
		raw.columns.forEach((column, index) => {
			const path = `columns[${index}]`;
			if (!column || typeof column !== 'object' || Array.isArray(column)) {
				errors.push(`${path} must be an object`);
				return;
			}
			if (typeof column.key !== 'string' || !column.key) errors.push(`${path}.key must be a non-empty string`);
			else if (keys.has(column.key)) errors.push(`${path}.key must be unique`);
			else keys.add(column.key);
			if (!COLUMN_KINDS.has(column.kind)) errors.push(`${path}.kind must be chars, time, or word`);
			if (typeof column.sourceField !== 'string' || !column.sourceField) errors.push(`${path}.sourceField must be a non-empty string`);
			if (column.kind === 'chars' && column.unitCount !== undefined && (!Number.isInteger(column.unitCount) || column.unitCount < 1)) errors.push(`${path}.unitCount must be a positive integer`);
			if (column.presetKey !== undefined) {
				if (typeof column.presetKey !== 'string' || !column.presetKey) {
					errors.push(`${path}.presetKey must be a non-empty string`);
				} else if (raw.presets && typeof raw.presets === 'object' && !Array.isArray(raw.presets) && !raw.presets[column.presetKey]) {
					errors.push(`${path}.presetKey "${column.presetKey}" references non-existent preset`);
				}
			}
		});
	}

	if (ui && typeof ui === 'object' && !Array.isArray(ui)) {
		if (ui.rows !== undefined && (!Number.isInteger(ui.rows) || ui.rows < 1)) errors.push('ui.rows must be a positive integer');
		if (ui.hiddenColumns !== undefined) {
			if (!Array.isArray(ui.hiddenColumns) || ui.hiddenColumns.some(key => typeof key !== 'string')) {
				errors.push('ui.hiddenColumns must be an array of strings');
			} else {
				ui.hiddenColumns.forEach(hiddenKey => {
					if (!columnKeys.has(hiddenKey)) {
						errors.push(`ui.hiddenColumns contains unknown key "${hiddenKey}"`);
					}
				});
			}
		}
		if (ui.window !== undefined && (!ui.window || typeof ui.window !== 'object' || Array.isArray(ui.window))) errors.push('ui.window must be an object');
		if (ui.window?.strategy !== undefined && !WINDOW_STRATEGIES.has(ui.window.strategy)) errors.push('ui.window.strategy must be nextByTime or static');
	}
	return { valid: errors.length === 0, errors };
}
