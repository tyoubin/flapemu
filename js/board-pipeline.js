import { normalizeBoardConfig } from './data-normalize.js';

function parseDepartMinutes(departTime) {
	if (typeof departTime !== 'string') return null;
	const match = departTime.match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return null;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
	return (hours * 60) + minutes;
}

export function sortByField(rows, field) {
	if (!Array.isArray(rows)) return [];
	return [...rows].sort((a, b) => {
		const left = a?.[field] || '';
		const right = b?.[field] || '';
		return left.localeCompare(right);
	});
}

export function extractFieldWords(rows, field) {
	if (!Array.isArray(rows)) return [];
	return rows.map((item) => {
		if (item[field] && item[field].local) return item[field];
		return { local: '' };
	});
}

/**
 * Select which rows fill the board.
 * @param {object} [windowOpts]
 * @param {'nextByTime'|'static'} [windowOpts.strategy='nextByTime']
 * @param {string} [windowOpts.timeField='depart_time']
 */
export function selectDisplayRows(rows, rowCount, windowOpts = {}, now = new Date()) {
	if (!Array.isArray(rows) || rows.length === 0 || rowCount <= 0) return [];

	// Backward-compatible: third arg may be a timeField string (older call sites/tests).
	const opts = typeof windowOpts === 'string'
		? { strategy: 'nextByTime', timeField: windowOpts }
		: (windowOpts || {});

	const strategy = opts.strategy || 'nextByTime';
	const timeField = opts.timeField || 'depart_time';

	if (strategy === 'static') {
		return rows.slice(0, rowCount);
	}

	// nextByTime (default): start at first row at/after now, wrap to fill rowCount.
	const currentMinutes = (now.getHours() * 60) + now.getMinutes();
	let startIndex = rows.findIndex((row) => {
		const departMinutes = parseDepartMinutes(row[timeField]);
		return departMinutes !== null && departMinutes >= currentMinutes;
	});

	if (startIndex === -1) startIndex = 0;

	const displayRows = [];
	for (let i = 0; i < rowCount; i++) {
		const dataIndex = (startIndex + i) % rows.length;
		displayRows.push(rows[dataIndex]);
	}
	return displayRows;
}

export function prepareBoardData(rawData) {
	const config = normalizeBoardConfig(rawData);
	return {
		presets: config.presets,
		rows: config.rows,
		columns: config.columns,
		ui: config.ui
	};
}

export { parseDepartMinutes };