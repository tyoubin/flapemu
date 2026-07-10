import assert from 'node:assert/strict';
import { normalizeBoardConfig, BOARD_CONFIG_VERSION } from '../js/data-normalize.js';

function test_v3_passthrough_preservesColumns() {
	const input = {
		schema_version: 3,
		meta: { header: { line_name: { local: 'Test', en: 'Test' }, for: { local: 'A', en: 'A' } } },
		ui: { rows: 6, showTopBar: true, mode: 'departures', hiddenColumns: ['remarks'], window: { strategy: 'nextByTime', timeField: 'depart_time' } },
		columns: [{ key: 'flight', cssClass: 'col-flight', header: { local: '便', en: 'Flight' }, kind: 'chars', field: 'flight_no', unitCount: 5, charset: ' ABC', unitCapacity: 10 }],
		presets: { airlines: [{ local: 'JAL', en: 'JAL' }] },
		rows: [{ flight_no: 'JL001', depart_time: '10:00' }]
	};
	const output = normalizeBoardConfig(input);
	assert.equal(output.schema_version, 3);
	assert.equal(output.columns.length, 1);
	assert.equal(output.columns[0].field, 'flight_no');
	assert.equal(output.columns[0].sourceField, 'flight_no');
	assert.equal(output.rows.length, 1);
	assert.equal(output.rows[0].flight_no, 'JL001');
	assert.equal(output.ui.rows, 6);
	assert.equal(output.ui.mode, 'departures');
	assert.deepEqual(output.ui.hiddenColumns, ['remarks']);
	console.log('  v3 passthrough preserves columns, ui, rows');
}

function test_v2_upgrade_addsTrainColumns() {
	const input = {
		schema_version: 2,
		meta: { header: { line_name: { local: '東海道', en: 'Tokaido' }, for: { local: '東京', en: 'Tokyo' } } },
		presets: { types: [{ local: '快速', en: 'Rapid', color: '#333' }], dests: [], remarks: [], stops: [] },
		schedule: [{ track_no: '1', depart_time: '09:00', type: { local: '快速' }, destination: { local: '東京' } }]
	};
	const output = normalizeBoardConfig(input);
	assert.equal(output.schema_version, 3);
	assert.equal(output.columns.length, 7);
	assert.equal(output.columns[0].key, 'plat');
	assert.equal(output.columns[0].field, 'track_no');
	assert.equal(output.rows.length, 1);
	assert.equal(output.rows[0].depart_time, '09:00');
	assert.equal(output.rows[0].destination.local, '東京');
	assert.equal(output.ui.mode, 'concourse');
	assert.deepEqual(output.ui.hiddenColumns, ['stop']);
	console.log('  v2 upgrade adds train columns and ui defaults');
}

function test_v3_acceptsScheduleAlias() {
	const input = {
		schema_version: 3,
		meta: { header: {} },
		ui: { rows: 4, mode: 'gate' },
		columns: [{ key: 'time', header: { local: '時刻', en: 'Time' }, kind: 'time', field: 'depart_time' }],
		presets: {},
		schedule: [{ depart_time: '10:00' }]
	};
	const output = normalizeBoardConfig(input);
	assert.equal(output.rows.length, 1);
	assert.equal(output.rows[0].depart_time, '10:00');
	console.log('  v3 accepts schedule as alias for rows');
}

function test_v3_addsColumnAliases() {
	const input = {
		schema_version: 3,
		meta: { header: {} },
		columns: [{ key: 'x', header: { local: 'X', en: 'X' }, kind: 'word', field: 'dest', preset: 'dests' }],
		presets: {},
		rows: []
	};
	const output = normalizeBoardConfig(input);
	const col = output.columns[0];
	assert.equal(col.sourceField, 'dest');
	assert.equal(col.presetKey, 'dests');
	assert.equal(col.visible, true);
	console.log('  v3 adds legacy field aliases');
}

function test_emptyInput_returnsEmptyConfig() {
	const output = normalizeBoardConfig(null);
	assert.equal(output.schema_version, 3);
	assert.deepEqual(output.columns, []);
	assert.deepEqual(output.rows, []);
	console.log('  empty input returns empty config');
}

function test_arrayInput_upgradedToV3() {
	const output = normalizeBoardConfig([{ time: '10:00', track: '1', type: 'EXP' }]);
	assert.equal(output.schema_version, 3);
	assert.equal(output.columns.length, 7);
	assert.equal(output.rows.length, 1);
	assert.equal(output.rows[0].depart_time, '10:00');
	console.log('  array input upgraded to v3 via v2 path');
}

console.log('normalizeBoardConfig:');
test_v3_passthrough_preservesColumns();
test_v2_upgrade_addsTrainColumns();
test_v3_acceptsScheduleAlias();
test_v3_addsColumnAliases();
test_emptyInput_returnsEmptyConfig();
test_arrayInput_upgradedToV3();
console.log('normalizeBoardConfig tests passed');