import assert from 'node:assert/strict';
import {
	applyTrackFilter,
	sortScheduleByDepartTime,
	extractScheduleWords,
	selectDisplayTrains,
	prepareTrainBoardData
} from '../js/train-pipeline.js';

function test_applyTrackFilter_filtersByTrackNo() {
	const data = [
		{ track_no: '1', depart_time: '09:00' },
		{ track_no: '2', depart_time: '10:00' },
		{ track_no: '3', depart_time: '11:00' },
	];
	const result = applyTrackFilter(data, ['1', '3']);
	assert.equal(result.length, 2);
	assert.equal(result[0].track_no, '1');
	assert.equal(result[1].track_no, '3');
}

function test_applyTrackFilter_passesThroughWithoutFilter() {
	const data = [{ track_no: '1' }, { track_no: '2' }];
	const result = applyTrackFilter(data, []);
	assert.equal(result.length, 2);
}

function test_applyTrackFilter_returnsEmptyForNonArray() {
	assert.deepEqual(applyTrackFilter(null, ['1']), []);
}

function test_sortScheduleByDepartTime_sortsByTime() {
	const data = [
		{ depart_time: '11:00' },
		{ depart_time: '09:00' },
		{ depart_time: '10:00' },
	];
	const result = sortScheduleByDepartTime(data);
	assert.equal(result[0].depart_time, '09:00');
	assert.equal(result[1].depart_time, '10:00');
	assert.equal(result[2].depart_time, '11:00');
}

function test_selectDisplayTrains_selectsByDepartTime() {
	const data = [
		{ depart_time: '09:00' },
		{ depart_time: '10:00' },
		{ depart_time: '11:00' },
		{ depart_time: '12:00' },
	];
	const now = new Date('2025-01-01T10:30:00');
	const result = selectDisplayTrains(data, 2, now);
	assert.equal(result.length, 2);
	assert.equal(result[0].depart_time, '11:00');
	assert.equal(result[1].depart_time, '12:00');
}

function test_extractScheduleWords_extractsByField() {
	const data = [
		{ destination: { local: '東京', en: 'Tokyo' } },
		{ destination: { local: '大阪', en: 'Osaka' } },
	];
	const result = extractScheduleWords(data, 'destination');
	assert.equal(result.length, 2);
	assert.equal(result[0].local, '東京');
	assert.equal(result[1].local, '大阪');
}

function test_prepareTrainBoardData_appliesFilterAndSort() {
	const raw = {
		schema_version: 3,
		meta: { header: { logo_url: 'logo.svg', line_name: { local: 'Test', en: 'Test' }, for: { local: 'A', en: 'A' } } },
		columns: [],
		presets: { types: [] },
		rows: [
			{ track_no: '2', depart_time: '11:00', type: { local: '快速', en: 'Rapid' } },
			{ track_no: '1', depart_time: '09:00', type: { local: '各停', en: 'Local' } },
			{ track_no: '1', depart_time: '10:00', type: { local: '急行', en: 'Express' } },
		]
	};
	const result = prepareTrainBoardData(raw, ['1']);
	assert.equal(result.rows.length, 2);
	assert.equal(result.rows[0].depart_time, '09:00');
	assert.equal(result.rows[1].depart_time, '10:00');
	assert.ok(result.presets);
}

test_applyTrackFilter_filtersByTrackNo();
test_applyTrackFilter_passesThroughWithoutFilter();
test_applyTrackFilter_returnsEmptyForNonArray();
test_sortScheduleByDepartTime_sortsByTime();
test_selectDisplayTrains_selectsByDepartTime();
test_extractScheduleWords_extractsByField();
test_prepareTrainBoardData_appliesFilterAndSort();

console.log('train-pipeline tests passed');