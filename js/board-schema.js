const CHARS_NUM = " 0123456789";
const CHARS_ALPHANUM = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const DEFAULT_DISPLAY_MODE = 'concourse';

export const DISPLAY_MODE_PROFILES = {
	concourse: {
		defaultRows: 12,
		showTopBar: true,
		hiddenColumns: ['stop']
	},
	gate: {
		defaultRows: 4,
		showTopBar: false,
		hiddenColumns: ['stop']
	},
	platform: {
		defaultRows: 3,
		showTopBar: true,
		hiddenColumns: ['plat']
	}
};

export const COLUMN_SCHEMA = [
	{
		key: 'plat',
		cssClass: 'col-plat',
		header: { local: 'のりば', en: 'Track' },
		kind: 'chars',
		sourceField: 'track_no',
		padEnd: 3,
		unitCount: 3,
		charset: CHARS_ALPHANUM,
		unitCapacity: 15
	},
	{
		key: 'type',
		cssClass: 'col-type',
		header: { local: '種別', en: 'Type' },
		kind: 'word',
		sourceField: 'type',
		presetKey: 'types',
		keepTypeColors: true,
		widthVar: '--col-type-width',
		minChars: 4
	},
	{
		key: 'no',
		cssClass: 'col-no',
		header: { local: '列車番号', en: 'Train No.' },
		kind: 'chars',
		sourceField: 'train_no',
		padEnd: 5,
		unitCount: 5,
		charset: CHARS_ALPHANUM,
		unitCapacity: 50
	},
	{
		key: 'time',
		cssClass: 'col-time',
		header: { local: '時刻', en: 'Time' },
		kind: 'time',
		sourceField: 'depart_time',
		unitCapacity: 20
	},
	{
		key: 'dest',
		cssClass: 'col-dest',
		header: { local: '行先', en: 'Dest.' },
		kind: 'word',
		sourceField: 'destination',
		presetKey: 'dests',
		widthVar: '--col-dest-width',
		minChars: 5
	},
	{
		key: 'remarks',
		cssClass: 'col-remarks',
		header: { local: '記事', en: 'Remarks' },
		kind: 'word',
		sourceField: 'remarks',
		presetKey: 'remarks',
		widthVar: '--col-rem-width',
		minChars: 6
	},
	{
		key: 'stop',
		cssClass: 'col-stop',
		header: { local: '停車駅', en: 'Train Stops' },
		kind: 'word',
		sourceField: 'stops_at',
		presetKey: 'stops',
		widthVar: '--col-stop-width',
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
