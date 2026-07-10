export const BOARD_CONFIG_VERSION = 3;

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
