import { normalizeTimetable } from './data-normalize.js';

function parseDepartMinutes(departTime) {
	if (typeof departTime !== 'string') return null;
	const match = departTime.match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return null;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
	return (hours * 60) + minutes;
}

export function sortByField(scheduleData, field) {
	if (!Array.isArray(scheduleData)) return [];
	return [...scheduleData].sort((a, b) => {
		const left = a?.[field] || '';
		const right = b?.[field] || '';
		return left.localeCompare(right);
	});
}

export function extractFieldWords(scheduleData, field) {
	if (!Array.isArray(scheduleData)) return [];
	return scheduleData.map((item) => {
		if (item[field] && item[field].local) return item[field];
		return { local: '' };
	});
}

export function selectDisplayRows(scheduleData, rowCount, timeField, now = new Date()) {
	if (!Array.isArray(scheduleData) || scheduleData.length === 0 || rowCount <= 0) return [];

	const currentMinutes = (now.getHours() * 60) + now.getMinutes();
	let startIndex = scheduleData.findIndex((row) => {
		const departMinutes = parseDepartMinutes(row[timeField]);
		return departMinutes !== null && departMinutes >= currentMinutes;
	});

	if (startIndex === -1) startIndex = 0;

	const displayRows = [];
	for (let i = 0; i < rowCount; i++) {
		const dataIndex = (startIndex + i) % scheduleData.length;
		displayRows.push(scheduleData[dataIndex]);
	}
	return displayRows;
}

export function prepareBoardData(rawData) {
	const normalized = normalizeTimetable(rawData);
	return {
		presetsData: normalized.presets || {},
		metaData: normalized.meta || {},
		scheduleData: normalized.schedule
	};
}

export { parseDepartMinutes };