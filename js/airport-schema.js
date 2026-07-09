const CHARS_NUM = " 0123456789";
const CHARS_ALPHANUM = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARS_UPPER = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const DEFAULT_DISPLAY_MODE = 'departures';

export const DISPLAY_MODE_PROFILES = {
	departures: {
		defaultRows: 8,
		showTopBar: true,
		hiddenColumns: []
	},
	arrivals: {
		defaultRows: 8,
		showTopBar: true,
		hiddenColumns: ['gate']
	}
};

export const COLUMN_SCHEMA = [
	{
		key: 'flight',
		cssClass: 'col-flight',
		header: { local: '便名', en: 'Flight' },
		kind: 'chars',
		sourceField: 'flight_no',
		padEnd: 6,
		unitCount: 6,
		charset: CHARS_ALPHANUM,
		unitCapacity: 50
	},
	{
		key: 'dest',
		cssClass: 'col-airport-dest',
		header: { local: '目的地', en: 'Destination' },
		kind: 'word',
		sourceField: 'destination',
		presetKey: 'dests',
		widthVar: '--col-dest-width',
		minChars: 8
	},
	{
		key: 'airline',
		cssClass: 'col-airline',
		header: { local: '航空会社', en: 'Airline' },
		kind: 'word',
		sourceField: 'airline',
		presetKey: 'airlines',
		colorFields: { background: 'airline_color', text: 'airline_text_color' },
		widthVar: '--col-airline-width',
		minChars: 6
	},
	{
		key: 'gate',
		cssClass: 'col-gate',
		header: { local: '搭乗口', en: 'Gate' },
		kind: 'chars',
		sourceField: 'gate',
		padEnd: 3,
		unitCount: 3,
		charset: CHARS_ALPHANUM,
		unitCapacity: 15
	},
	{
		key: 'status',
		cssClass: 'col-status',
		header: { local: '状況', en: 'Status' },
		kind: 'word',
		sourceField: 'status',
		presetKey: 'statuses',
		colorFields: { background: 'status_color', text: 'status_text_color' },
		widthVar: '--col-status-width',
		minChars: 6
	},
	{
		key: 'remarks',
		cssClass: 'col-remarks',
		header: { local: '備考', en: 'Remarks' },
		kind: 'word',
		sourceField: 'remarks',
		presetKey: 'remarks',
		widthVar: '--col-rem-width',
		minChars: 4
	}
];

export function getDisplayModeProfile(mode) {
	return DISPLAY_MODE_PROFILES[mode] || DISPLAY_MODE_PROFILES[DEFAULT_DISPLAY_MODE];
}

export function getVisibleColumns(mode) {
	const hiddenColumns = new Set(getDisplayModeProfile(mode).hiddenColumns || []);
	return COLUMN_SCHEMA.filter(col => !hiddenColumns.has(col.key));
}

export function getDynamicWidthColumns() {
	return COLUMN_SCHEMA.filter(col => col.kind === 'word' && col.widthVar);
}

export function getNumericCharset() {
	return CHARS_NUM;
}