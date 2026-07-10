export const CURRENT_SCHEMA_VERSION = 2;
export const BOARD_CONFIG_VERSION = 3;

const TRAIN_COLUMN_DEFAULTS = [
	{
		key: 'plat', cssClass: 'col-plat', header: { local: 'のりば', en: 'Track' },
		kind: 'chars', field: 'track_no', padEnd: 3, unitCount: 3,
		charset: ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', unitCapacity: 15, visible: true
	},
	{
		key: 'type', cssClass: 'col-type', header: { local: '種別', en: 'Type' },
		kind: 'word', field: 'type', preset: 'types',
		colorFields: { background: 'type_color_hex', text: 'type_text_color' },
		widthVar: '--col-type-width', minChars: 4, visible: true
	},
	{
		key: 'no', cssClass: 'col-no', header: { local: '列車番号', en: 'Train No.' },
		kind: 'chars', field: 'train_no', padEnd: 5, unitCount: 5,
		charset: ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', unitCapacity: 50, visible: true
	},
	{
		key: 'time', cssClass: 'col-time', header: { local: '時刻', en: 'Time' },
		kind: 'time', field: 'depart_time', unitCapacity: 20, visible: true
	},
	{
		key: 'dest', cssClass: 'col-dest', header: { local: '行先', en: 'Dest.' },
		kind: 'word', field: 'destination', preset: 'dests',
		widthVar: '--col-dest-width', minChars: 5, visible: true
	},
	{
		key: 'remarks', cssClass: 'col-remarks', header: { local: '記事', en: 'Remarks' },
		kind: 'word', field: 'remarks', preset: 'remarks',
		widthVar: '--col-rem-width', minChars: 6, visible: true
	},
	{
		key: 'stop', cssClass: 'col-stop', header: { local: '停車駅', en: 'Train Stops' },
		kind: 'word', field: 'stops_at', preset: 'stops',
		widthVar: '--col-stop-width', minChars: 4, visible: true
	}
];

const TRAIN_UI_DEFAULTS = {
	concourse: { rows: 12, showTopBar: true, hiddenColumns: ['stop'] },
	gate: { rows: 4, showTopBar: false, hiddenColumns: ['stop'] },
	platform: { rows: 3, showTopBar: true, hiddenColumns: ['plat'] }
};

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

function normalizeScheduleRecord(record) {
	const safeRecord = record && typeof record === 'object' ? record : {};
	const safeType = normalizeBilingual(safeRecord.type || safeRecord.train_type || safeRecord.kind);
	return {
		...safeRecord,
		track_no: toSafeString(safeRecord.track_no ?? safeRecord.track, ''),
		type: safeType,
		type_color_hex: toSafeString(
			safeRecord.type_color_hex ?? safeRecord.type_color ?? safeRecord.type?.color,
			'#333333'
		),
		type_text_color: toSafeString(
			safeRecord.type_text_color ?? safeRecord.type_text_color_hex ?? safeRecord.type?.textColor,
			'#ffffff'
		),
		train_no: toSafeString(safeRecord.train_no ?? safeRecord.no, ''),
		depart_time: toSafeString(safeRecord.depart_time ?? safeRecord.time, ''),
		destination: normalizeBilingual(safeRecord.destination || safeRecord.dest || safeRecord.to),
		remarks: normalizeBilingual(safeRecord.remarks || safeRecord.remark || safeRecord.note),
		stops_at: normalizeBilingual(safeRecord.stops_at || safeRecord.stop || safeRecord.stops)
	};
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

function normalizeUI(ui, modeFallback) {
	const safe = ui && typeof ui === 'object' ? ui : {};
	const profile = modeFallback && TRAIN_UI_DEFAULTS[modeFallback];
	return {
		rows: Number.isFinite(safe.rows) ? safe.rows : (profile?.rows ?? 12),
		showTopBar: safe.showTopBar !== undefined ? safe.showTopBar : (profile?.showTopBar ?? true),
		cascadeMs: Number.isFinite(safe.cascadeMs) ? safe.cascadeMs : 1000,
		refreshMs: Number.isFinite(safe.refreshMs) ? safe.refreshMs : 30000,
		mode: safe.mode || modeFallback || 'concourse',
		hiddenColumns: Array.isArray(safe.hiddenColumns)
			? safe.hiddenColumns
			: (profile?.hiddenColumns ?? []),
		window: safe.window || { strategy: 'nextByTime', timeField: 'depart_time' }
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
		ui: normalizeUI(null, 'concourse'),
		columns: [],
		presets: {},
		rows: []
	};
}

export function normalizeBoardConfig(raw) {
	if (!raw || typeof raw !== 'object') return createEmptyBoardConfig();

	if (raw.schema_version === 3) {
		const columns = (raw.columns || []).map(addColumnAliases);
		const rows = Array.isArray(raw.rows || raw.schedule) ? [...(raw.rows || raw.schedule)] : [];
		return {
			schema_version: 3,
			meta: normalizeHeader(raw.meta),
			ui: normalizeUI(raw.ui, raw.ui?.mode),
			columns,
			presets: normalizePresets(raw.presets),
			rows
		};
	}

	if (Array.isArray(raw)) {
		const v2 = normalizeTimetable(raw);
		return upgradeV2toV3(v2);
	}

	if (raw.schema_version === 2 || !raw.schema_version) {
		const v2 = normalizeTimetable(raw);
		return upgradeV2toV3(v2);
	}

	return createEmptyBoardConfig();
}

function upgradeV2toV3(v2) {
	return {
		schema_version: 3,
		meta: v2.meta,
		ui: normalizeUI(null, 'concourse'),
		columns: TRAIN_COLUMN_DEFAULTS.map(addColumnAliases),
		presets: v2.presets || {},
		rows: v2.schedule || []
	};
}

export function createEmptyTimetable() {
	return {
		schema_version: 2,
		meta: {
			header: {
				logo_url: 'timetable/logo.svg',
				line_name: { local: '', en: '' },
				for: { local: '', en: '' }
			}
		},
		presets: {
			types: [], dests: [], remarks: [], stops: []
		},
		schedule: []
	};
}

export function normalizeTimetable(raw) {
	if (Array.isArray(raw)) {
		return {
			...createEmptyTimetable(),
			schema_version: 1,
			schedule: raw.map(normalizeScheduleRecord)
		};
	}

	const safeRaw = raw && typeof raw === 'object' ? raw : {};
	const safePresets = safeRaw.presets && typeof safeRaw.presets === 'object' ? safeRaw.presets : {};
	const safeSchedule = Array.isArray(safeRaw.schedule) ? safeRaw.schedule : [];
	const schemaVersion = Number.isFinite(Number(safeRaw.schema_version))
		? Number(safeRaw.schema_version)
		: 2;

	return {
		schema_version: schemaVersion,
		meta: { header: normalizeHeader(safeRaw.meta) },
		presets: {
			types: normalizePresetList(safePresets.types),
			dests: normalizePresetList(safePresets.dests),
			remarks: normalizePresetList(safePresets.remarks),
			stops: normalizePresetList(safePresets.stops),
			...Object.fromEntries(
				Object.entries(safePresets)
					.filter(([k]) => !['types', 'dests', 'remarks', 'stops'].includes(k))
					.map(([k, v]) => [k, normalizePresetList(v)])
			)
		},
		schedule: safeSchedule.map(normalizeScheduleRecord)
	};
}