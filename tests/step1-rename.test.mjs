import assert from 'node:assert/strict';
import { selectDisplayRows } from '../js/board-pipeline.js';

function test_selectDisplayRows_ExportsCorrectFunctionName() {
	assert.equal(typeof selectDisplayRows, 'function');
}

function test_selectDisplayRows_returnsEmptyForEmptyData() {
	const result = selectDisplayRows([], 5, new Date());
	assert.deepEqual(result, []);
}

function test_selectDisplayRows_returnsEmptyForNullData() {
	const result = selectDisplayRows(null, 5, new Date());
	assert.deepEqual(result, []);
}

function test_selectDisplayRows_returnsEmptyForNonPositiveRowCount() {
	const result = selectDisplayRows([{ depart_time: '10:00' }], 0, new Date());
	assert.deepEqual(result, []);
}

function test_selectDisplayRows_selectsRowsAfterCurrentTime() {
	const data = [
		{ depart_time: '09:00' },
		{ depart_time: '10:00' },
		{ depart_time: '11:00' },
		{ depart_time: '12:00' },
	];
	const now = new Date('2025-01-01T10:30:00');
	const result = selectDisplayRows(data, 2, now);
	assert.equal(result.length, 2);
	assert.equal(result[0].depart_time, '11:00');
	assert.equal(result[1].depart_time, '12:00');
}

function test_selectDisplayRows_wrapsAroundWhenEndReached() {
	const data = [
		{ depart_time: '09:00' },
		{ depart_time: '10:00' },
	];
	const now = new Date('2025-01-01T11:00:00');
	const result = selectDisplayRows(data, 3, now);
	assert.equal(result.length, 3);
	assert.equal(result[0].depart_time, '09:00');
	assert.equal(result[1].depart_time, '10:00');
	assert.equal(result[2].depart_time, '09:00');
}

function test_selectDisplayRows_startsWithFirstEntryWhenNoneMatch() {
	const data = [
		{ depart_time: '09:00' },
		{ depart_time: '10:00' },
	];
	const now = new Date('2025-01-01T23:00:00');
	const result = selectDisplayRows(data, 1, now);
	assert.equal(result.length, 1);
	assert.equal(result[0].depart_time, '09:00');
}

test_selectDisplayRows_ExportsCorrectFunctionName();
test_selectDisplayRows_returnsEmptyForEmptyData();
test_selectDisplayRows_returnsEmptyForNullData();
test_selectDisplayRows_returnsEmptyForNonPositiveRowCount();
test_selectDisplayRows_selectsRowsAfterCurrentTime();
test_selectDisplayRows_wrapsAroundWhenEndReached();
test_selectDisplayRows_startsWithFirstEntryWhenNoneMatch();

console.log('step1-rename tests passed');