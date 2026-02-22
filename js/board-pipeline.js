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

export function applyTrackFilter(scheduleData, filterTracks) {
	if (!Array.isArray(scheduleData)) return [];
	if (!filterTracks || filterTracks.length === 0) return [...scheduleData];

	return scheduleData.filter((train) => filterTracks.includes(String(train.track_no)));
}

export function sortScheduleByDepartTime(scheduleData) {
	if (!Array.isArray(scheduleData)) return [];
	return [...scheduleData].sort((a, b) => {
		const left = a?.depart_time || '';
		const right = b?.depart_time || '';
		return left.localeCompare(right);
	});
}

export function extractScheduleWords(scheduleData, field) {
	if (!Array.isArray(scheduleData)) return [];
	return scheduleData.map((item) => {
		if (item[field] && item[field].local) return item[field];
		return { local: '' };
	});
}

export function selectDisplayTrains(scheduleData, rowCount, now = new Date()) {
	if (!Array.isArray(scheduleData) || scheduleData.length === 0 || rowCount <= 0) return [];

	const currentMinutes = (now.getHours() * 60) + now.getMinutes();
	let startIndex = scheduleData.findIndex((train) => {
		const departMinutes = parseDepartMinutes(train.depart_time);
		return departMinutes !== null && departMinutes >= currentMinutes;
	});

	if (startIndex === -1) startIndex = 0;

	const displayTrains = [];
	for (let i = 0; i < rowCount; i++) {
		const dataIndex = (startIndex + i) % scheduleData.length;
		displayTrains.push(scheduleData[dataIndex]);
	}
	return displayTrains;
}

export function prepareBoardData(rawData, filterTracks) {
	const normalized = normalizeTimetable(rawData);
	const scheduleData = sortScheduleByDepartTime(applyTrackFilter(normalized.schedule, filterTracks));

	return {
		presetsData: normalized.presets || {},
		metaData: normalized.meta || {},
		scheduleData
	};
}
