import { sortByField, selectDisplayRows, extractFieldWords, prepareBoardData } from './board-pipeline.js';

const TIME_FIELD = 'depart_time';
const TRACK_FIELD = 'track_no';

export function applyTrackFilter(rows, filterTracks) {
	if (!Array.isArray(rows)) return [];
	if (!filterTracks || filterTracks.length === 0) return [...rows];

	return rows.filter((row) => filterTracks.includes(String(row[TRACK_FIELD])));
}

export function sortScheduleByDepartTime(rows) {
	return sortByField(rows, TIME_FIELD);
}

export function extractScheduleWords(rows, field) {
	return extractFieldWords(rows, field);
}

export function selectDisplayTrains(rows, rowCount, now = new Date()) {
	return selectDisplayRows(rows, rowCount, TIME_FIELD, now);
}

export function prepareTrainBoardData(rawData, filterTracks) {
	const config = prepareBoardData(rawData);
	const rows = sortScheduleByDepartTime(applyTrackFilter(config.rows, filterTracks));
	return {
		meta: config.meta,
		presets: config.presets,
		rows,
		columns: config.columns,
		ui: config.ui,
		presetsData: config.presets,
		metaData: config.meta,
		scheduleData: rows
	};
}