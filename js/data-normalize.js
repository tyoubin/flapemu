export const CURRENT_SCHEMA_VERSION = 2;

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

function normalizeTypePresetItem(item) {
	const normalized = normalizeBilingual(item);
	if (item && typeof item === 'object') {
		if (item.color) normalized.color = toSafeString(item.color);
		if (item.textColor) normalized.textColor = toSafeString(item.textColor);
	}
	return normalized;
}

function normalizePresetList(list, itemNormalizer = normalizeBilingual) {
	if (!Array.isArray(list)) return [];
	return list.map(itemNormalizer);
}

function normalizeScheduleRecord(record) {
	const safeRecord = record && typeof record === 'object' ? record : {};
	const safeType = normalizeBilingual(safeRecord.type || safeRecord.train_type || safeRecord.kind);

	return {
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

export function createEmptyTimetable() {
	return {
		schema_version: CURRENT_SCHEMA_VERSION,
		meta: {
			header: {
				logo_url: 'timetable/logo.svg',
				line_name: { local: '', en: '' },
				for: { local: '', en: '' }
			}
		},
		presets: {
			types: [],
			dests: [],
			remarks: [],
			stops: []
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
		: CURRENT_SCHEMA_VERSION;

	return {
		schema_version: schemaVersion,
		meta: {
			header: normalizeHeader(safeRaw.meta)
		},
		presets: {
			types: normalizePresetList(safePresets.types, normalizeTypePresetItem),
			dests: normalizePresetList(safePresets.dests),
			remarks: normalizePresetList(safePresets.remarks),
			stops: normalizePresetList(safePresets.stops)
		},
		schedule: safeSchedule.map(normalizeScheduleRecord)
	};
}
