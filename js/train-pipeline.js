import { sortByField, selectDisplayRows, extractFieldWords, prepareBoardData } from './board-pipeline.js';

const TIME_FIELD = 'depart_time';
const TRACK_FIELD = 'track_no';

export function applyTrackFilter(scheduleData, filterTracks) {
	if (!Array.isArray(scheduleData)) return [];
	if (!filterTracks || filterTracks.length === 0) return [...scheduleData];

	return scheduleData.filter((row) => filterTracks.includes(String(row[TRACK_FIELD])));
}

export function sortScheduleByDepartTime(scheduleData) {
	return sortByField(scheduleData, TIME_FIELD);
}

export function extractScheduleWords(scheduleData, field) {
	return extractFieldWords(scheduleData, field);
}

export function selectDisplayTrains(scheduleData, rowCount, now = new Date()) {
	return selectDisplayRows(scheduleData, rowCount, TIME_FIELD, now);
}

export function prepareTrainBoardData(rawData, filterTracks) {
	const { presetsData, metaData, scheduleData } = prepareBoardData(rawData);
	const filtered = sortScheduleByDepartTime(applyTrackFilter(scheduleData, filterTracks));
	return { presetsData, metaData, scheduleData: filtered };
}