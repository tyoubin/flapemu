import assert from 'node:assert/strict';
import { getColumnTarget, buildActualWordMap } from '../js/record-transform.js';
import { selectDisplayRows } from '../js/board-pipeline.js';

function test_getColumnTarget_chars_padsString() {
	const col = { kind: 'chars', sourceField: 'code', padEnd: 4 };
	assert.equal(getColumnTarget(col, { code: 'AB' }), 'AB  ');
}

function test_getColumnTarget_chars_defaultPad() {
	const col = { kind: 'chars', sourceField: 'code' };
	assert.equal(getColumnTarget(col, { code: 'XYZ' }), 'XYZ');
}

function test_getColumnTarget_time_replacesSeparator() {
	const col = { kind: 'time', sourceField: 'depart_time', timeSeparator: '.' };
	assert.equal(getColumnTarget(col, { depart_time: '09:30' }), '09.30');
}

function test_getColumnTarget_time_preservesColon() {
	const col = { kind: 'time', sourceField: 'depart_time' };
	assert.equal(getColumnTarget(col, { depart_time: '14:15' }), '14:15');
}

function test_getColumnTarget_word_returnsFieldValue() {
	const col = { kind: 'word', sourceField: 'dest' };
	const val = { main: '東京', alt: 'TOKYO' };
	assert.equal(getColumnTarget(col, { dest: val }), val);
}

function test_getColumnTarget_word_nullSafe() {
	const col = { kind: 'word', sourceField: 'dest' };
	assert.equal(getColumnTarget(col, {}), null);
}

function test_getColumnTarget_word_colorFields() {
	const col = {
		kind: 'word',
		sourceField: 'dest',
		colorFields: { background: 'bg', text: 'tc' }
	};
	const result = getColumnTarget(col, {
		dest: { main: '快速', alt: 'RAPID' },
		bg: '#ff0000',
		tc: '#ffffff'
	});
	assert.deepEqual(result, { main: '快速', alt: 'RAPID', color: '#ff0000', textColor: '#ffffff' });
}

function test_getColumnTarget_word_colorFieldsMissingBg() {
	const col = {
		kind: 'word',
		sourceField: 'dest',
		colorFields: { background: 'bg', text: 'tc' }
	};
	const result = getColumnTarget(col, {
		dest: { main: '各停', alt: 'LOCAL' },
		tc: '#000'
	});
	assert.deepEqual(result, { main: '各停', alt: 'LOCAL', textColor: '#000' });
}

function test_getColumnTarget_unknownKind_returnsNull() {
	const col = { kind: 'unknown', sourceField: 'x' };
	assert.equal(getColumnTarget(col, { x: 'val' }), null);
}

function test_buildActualWordMap_filtersEmptyEntries() {
	const cols = [
		{ kind: 'word', sourceField: 'dest', key: 'dest' },
		{ kind: 'time', sourceField: 'time', key: 'time' },
	];
	const data = [
		{ dest: { main: '東京', alt: 'TOKYO' }, time: '09:00' },
		{ dest: null, time: '10:00' },
	];
	const map = buildActualWordMap(cols, data);
	assert.equal(map.dest.length, 1);
	assert.equal(map.dest[0].main, '東京');
}

function test_selectDisplayRows_staticEmptyData() {
	assert.deepEqual(selectDisplayRows([], 5, { strategy: 'static' }), []);
}

function test_selectDisplayRows_staticClampsToAvailable() {
	const data = [{ x: 'a' }, { x: 'b' }];
	const result = selectDisplayRows(data, 10, { strategy: 'static' });
	assert.equal(result.length, 2);
}

function test_selectDisplayRows_nextByTimeAllBeforeNow() {
	const data = [
		{ t: '09:00' },
		{ t: '10:00' },
	];
	const now = new Date('2025-01-01T23:00:00');
	const result = selectDisplayRows(data, 2, { strategy: 'nextByTime', timeField: 't' }, now);
	assert.equal(result[0].t, '09:00');
	assert.equal(result[1].t, '10:00');
}

function test_selectDisplayRows_nextByTimeWraps() {
	const data = [
		{ t: '09:00' },
		{ t: '10:00' },
	];
	const now = new Date('2025-01-01T11:00:00');
	const result = selectDisplayRows(data, 3, { strategy: 'nextByTime', timeField: 't' }, now);
	assert.equal(result.length, 3);
	assert.equal(result[0].t, '09:00'); // wraps from start
	assert.equal(result[2].t, '09:00'); // back to start
}

function test_selectDisplayRows_nextByTimeBadTimeValue() {
	const data = [
		{ t: 'invalid' },
		{ t: '10:00' },
	];
	const now = new Date('2025-01-01T09:00:00');
	// invalid time is skipped by findIndex, so it starts at index 0
	const result = selectDisplayRows(data, 2, { strategy: 'nextByTime', timeField: 't' }, now);
	assert.equal(result.length, 2);
}

test_getColumnTarget_chars_padsString();
test_getColumnTarget_chars_defaultPad();
test_getColumnTarget_time_replacesSeparator();
test_getColumnTarget_time_preservesColon();
test_getColumnTarget_word_returnsFieldValue();
test_getColumnTarget_word_nullSafe();
test_getColumnTarget_word_colorFields();
test_getColumnTarget_word_colorFieldsMissingBg();
test_getColumnTarget_unknownKind_returnsNull();
test_buildActualWordMap_filtersEmptyEntries();
test_selectDisplayRows_staticEmptyData();
test_selectDisplayRows_staticClampsToAvailable();
test_selectDisplayRows_nextByTimeAllBeforeNow();
test_selectDisplayRows_nextByTimeWraps();
test_selectDisplayRows_nextByTimeBadTimeValue();

console.log('unit tests passed');
