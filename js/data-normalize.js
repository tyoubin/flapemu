export const BOARD_CONFIG_VERSION = 3;

export const TRAIN_COLUMN_DEFAULTS = [
	{ key: 'plat', cssClass: 'col-plat', header: { local: 'のりば', en: 'Track' }, kind: 'chars', field: 'track_no', padEnd: 3, unitCount: 3, charset: ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', unitCapacity: 15 },
	{ key: 'type', cssClass: 'col-type', header: { local: '種別', en: 'Type' }, kind: 'word', field: 'type', preset: 'types', colorFields: { background: 'type_color_hex', text: 'type_text_color' }, widthVar: '--col-type-width', minChars: 4 },
	{ key: 'no', cssClass: 'col-no', header: { local: '列車番号', en: 'Train No.' }, kind: 'chars', field: 'train_no', padEnd: 5, unitCount: 5, charset: ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', unitCapacity: 50 },
	{ key: 'time', cssClass: 'col-time', header: { local: '時刻', en: 'Time' }, kind: 'time', field: 'depart_time', unitCapacity: 20 },
	{ key: 'dest', cssClass: 'col-dest', header: { local: '行先', en: 'Dest.' }, kind: 'word', field: 'destination', preset: 'dests', widthVar: '--col-dest-width', minChars: 5 },
	{ key: 'remarks', cssClass: 'col-remarks', header: { local: '記事', en: 'Remarks' }, kind: 'word', field: 'remarks', preset: 'remarks', widthVar: '--col-rem-width', minChars: 6 },
	{ key: 'stop', cssClass: 'col-stop', header: { local: '停車駅', en: 'Train Stops' }, kind: 'word', field: 'stops_at', preset: 'stops', widthVar: '--col-stop-width', minChars: 4 }
];

function toSafeString(value, fallback = '') {
	if (value === null || value === undefined) return fallback;
	return String(value);
}

function normalizeBilingual(value) {
	if (typeof value === 'string') {
		return { local: value, en: '' };
	}
	if (value && typeof value === 'object') {
		return {
			local: toSafeString(value.local, ''),
			en: toSafeString(value.en, '')
		};
	}
	return { local: '', en: '' };
}

function normalizePresetItem(value) {
	const base = normalizeBilingual(value);
	if (value && typeof value === 'object') {
		if (value.color) base.color = toSafeString(value.color);
		if (value.textColor) base.textColor = toSafeString(value.textColor);
	}
	return base;
}

function normalizePresetList(list, itemNormalizer = normalizePresetItem) {
	if (!Array.isArray(list)) return [];
	return list.map(itemNormalizer);
}

function normalizeHeader(meta) {
	const safeMeta = meta && typeof meta === 'object' ? meta : {};
	const safeHeader = safeMeta.header && typeof safeMeta.header === 'object' ? safeMeta.header : {};
	return {
		logo_url: toSafeString(safeHeader.logo_url, 'timetable/logo.svg'),
		line_name: normalizeBilingual(safeHeader.line_name),
		for: normalizeBilingual(safeHeader.for)
	};
}

function addColumnAliases(col) {
	return {
		...col,
		sourceField: col.sourceField || col.field,
		field: col.field || col.sourceField,
		presetKey: col.presetKey || col.preset,
		preset: col.preset || col.presetKey,
		visible: col.visible !== undefined ? col.visible : true
	};
}

function normalizeUI(ui) {
	if (!ui || typeof ui !== 'object') {
		return { rows: 12, showTopBar: true, cascadeMs: 1000, refreshMs: 30000, mode: 'concourse', hiddenColumns: [], window: { strategy: 'nextByTime', timeField: 'depart_time' } };
	}
	return {
		rows: Number.isFinite(ui.rows) ? ui.rows : 12,
		showTopBar: ui.showTopBar !== undefined ? ui.showTopBar : true,
		cascadeMs: Number.isFinite(ui.cascadeMs) ? ui.cascadeMs : 1000,
		refreshMs: Number.isFinite(ui.refreshMs) ? ui.refreshMs : 30000,
		mode: ui.mode || 'concourse',
		hiddenColumns: Array.isArray(ui.hiddenColumns) ? ui.hiddenColumns : [],
		window: ui.window || { strategy: 'nextByTime', timeField: 'depart_time' }
	};
}

function normalizePresets(rawPresets) {
	if (!rawPresets || typeof rawPresets !== 'object') return {};
	const presets = {};
	for (const key of Object.keys(rawPresets)) {
		presets[key] = normalizePresetList(rawPresets[key]);
	}
	return presets;
}

export function createEmptyBoardConfig() {
	return {
		schema_version: BOARD_CONFIG_VERSION,
		meta: { header: { logo_url: 'timetable/logo.svg', line_name: { local: '', en: '' }, for: { local: '', en: '' } } },
		ui: normalizeUI(null),
		columns: [],
		presets: {},
		rows: []
	};
}

const V1_FIELD_MAP = {
	track: 'track_no',
	kind: 'type', no: 'train_no', time: 'depart_time',
	to: 'destination', note: 'remarks', stop: 'stops_at',
	type_color: 'type_color_hex', type_text_color_hex: 'type_text_color'
};

function upgradeV1Row(raw) {
	const row = {};
	for (const [oldKey, newKey] of Object.entries(V1_FIELD_MAP)) {
		if (raw[oldKey] !== undefined) row[newKey] = raw[oldKey];
	}
	for (const key of Object.keys(raw)) {
		if (!(key in V1_FIELD_MAP)) row[key] = raw[key];
	}
	if (row.type && typeof row.type === 'string') row.type = { local: row.type, en: '' };
	return row;
}

const V2_ALIAS_MAP = {
	track: 'track_no', train_type: 'type', type_color: 'type_color_hex',
	type_text_color_hex: 'type_text_color', no: 'train_no', time: 'depart_time',
	dest: 'destination', remark: 'remarks', stops: 'stops_at'
};

function upgradeV2Row(raw) {
	const row = { ...raw };
	for (const [oldKey, newKey] of Object.entries(V2_ALIAS_MAP)) {
		if (row[oldKey] !== undefined) {
			row[newKey] = row[oldKey];
			delete row[oldKey];
		}
	}
	return row;
}

function upgradeV2ToV3(raw) {
	const rawSchedule = Array.isArray(raw.schedule) ? raw.schedule : [];
	return {
		schema_version: BOARD_CONFIG_VERSION,
		meta: normalizeHeader(raw.meta),
		ui: normalizeUI({ mode: 'concourse' }),
		columns: TRAIN_COLUMN_DEFAULTS.map(addColumnAliases),
		presets: normalizePresets(raw.presets),
		rows: rawSchedule.map(upgradeV2Row)
	};
}

export function normalizeBoardConfig(raw) {
	if (!raw) return createEmptyBoardConfig();

	if (Array.isArray(raw)) {
		return {
			schema_version: BOARD_CONFIG_VERSION,
			meta: normalizeHeader(null),
			ui: normalizeUI({ mode: 'concourse' }),
			columns: TRAIN_COLUMN_DEFAULTS.map(addColumnAliases),
			presets: {},
			rows: raw.map(upgradeV1Row)
		};
	}

	if (typeof raw === 'object') {
		if (raw.schema_version === 3) {
			const columns = (raw.columns || []).map(addColumnAliases);
			const rows = Array.isArray(raw.rows || raw.schedule) ? [...(raw.rows || raw.schedule)] : [];
			return {
				schema_version: 3,
				meta: normalizeHeader(raw.meta),
				ui: normalizeUI(raw.ui),
				columns,
				presets: normalizePresets(raw.presets),
				rows
			};
		}
		if (raw.schema_version === 2 || raw.schedule) {
			return upgradeV2ToV3(raw);
		}
	}

	return createEmptyBoardConfig();
}