import assert from 'node:assert/strict';
import { normalizeBoardConfig, BOARD_CONFIG_VERSION } from '../js/data-normalize.js';

function test_v3_passthrough_preservesColumns() {
	const input = {
		schema_version: 3,
		meta: { header: { line_name: { local: 'Test', en: 'Test' }, for: { local: 'A', en: 'A' } } },
		ui: { rows: 6, mode: 'departures', hiddenColumns: ['remarks'], window: { strategy: 'nextByTime', timeField: 'depart_time' } },
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

function test_nonObjectInput_returnsEmptyConfig() {
	assert.deepEqual(normalizeBoardConfig('bad').rows, []);
	assert.deepEqual(normalizeBoardConfig(42).rows, []);
	assert.deepEqual(normalizeBoardConfig(undefined).rows, []);
	console.log('  non-object input returns empty config');
}

function test_uiDefaultsWithPartialUi() {
	const r = normalizeBoardConfig({ schema_version: 3, ui: { mode: 'gate' }, columns: [], presets: {}, rows: [] });
	assert.equal(r.ui.mode, 'gate');
	assert.equal(r.ui.rows, 12);
	assert.equal(r.ui.cascadeMs, 1000);
	assert.equal(r.ui.refreshMs, 30000);
	assert.deepEqual(r.ui.hiddenColumns, []);
	console.log('  partial ui fills defaults');
}

function test_uiDefaultsWithMissingUi() {
	const r = normalizeBoardConfig({ schema_version: 3, columns: [], presets: {}, rows: [] });
	assert.equal(r.ui.mode, 'concourse');
	assert.equal(r.ui.rows, 12);
	console.log('  missing ui uses defaults');
}

function test_nullPresets_returnsEmpty() {
	const r = normalizeBoardConfig({ schema_version: 3, columns: [], presets: null, rows: [] });
	assert.deepEqual(r.presets, {});
	console.log('  null presets returns empty object');
}

function test_malformedPresets_usesEmptyArray() {
	const r = normalizeBoardConfig({ schema_version: 3, columns: [], presets: { types: 'not-array' }, rows: [] });
	assert.deepEqual(r.presets.types, []);
	console.log('  malformed presets list returns empty array');
}

function test_v2WithAliasFields_upgradesCorrectly() {
	const r = normalizeBoardConfig({
		schema_version: 2,
		presets: {},
		schedule: [{
			track: '7', train_type: { local: '特急', en: 'Limited Express' },
			type_color: '#111', type_text_color_hex: '#eee',
			no: '77', time: '12:45', dest: { local: '博多' }, remark: '指定席', stops: '主要駅'
		}]
	});
	const row = r.rows[0];
	assert.equal(row.track_no, '7');
	assert.equal(row.train_no, '77');
	assert.equal(row.depart_time, '12:45');
	assert.equal(row.type.local, '特急');
	assert.equal(row.type_color_hex, '#111');
	assert.equal(row.type_text_color, '#eee');
	assert.equal(row.destination.local, '博多');
	assert.equal(row.remarks, '指定席');
	assert.equal(row.stops_at, '主要駅');
	console.log('  v2 alias fields upgrade correctly');
}

function test_v2EmptySchedule_returnsEmptyRows() {
	const r = normalizeBoardConfig({ schema_version: 2, presets: {}, schedule: null });
	assert.deepEqual(r.rows, []);
	assert.equal(r.columns.length, 7);
	console.log('  v2 empty/null schedule returns empty rows');
}

console.log('normalizeBoardConfig:');
test_v3_passthrough_preservesColumns();
test_v2_upgrade_addsTrainColumns();
test_v3_acceptsScheduleAlias();
test_v3_addsColumnAliases();
test_emptyInput_returnsEmptyConfig();
test_arrayInput_upgradedToV3();
test_nonObjectInput_returnsEmptyConfig();
test_uiDefaultsWithPartialUi();
test_uiDefaultsWithMissingUi();
test_nullPresets_returnsEmpty();
test_malformedPresets_usesEmptyArray();
test_v2WithAliasFields_upgradesCorrectly();
test_v2EmptySchedule_returnsEmptyRows();
console.log('normalizeBoardConfig tests passed');