import { selectDisplayRows, sortByField, prepareBoardData } from './board-pipeline.js';

export function sortByDepartTime(scheduleData) {
	return sortByField(scheduleData, 'depart_time');
}

export function selectDisplayFlights(scheduleData, rowCount, now = new Date()) {
	return selectDisplayRows(scheduleData, rowCount, 'depart_time', now);
}

export function prepareAirportBoardData(rawData) {
	const { presetsData, metaData, scheduleData } = prepareBoardData(rawData);
	return {
		presetsData,
		metaData,
		scheduleData: sortByDepartTime(scheduleData)
	};
}