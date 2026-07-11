import assert from 'node:assert/strict';
import { normalizeBoardConfig, BOARD_CONFIG_VERSION } from '../js/data-normalize.js';

function test_v3_passthrough_preservesInput() {
	const input = {
		schema_version: 3,
		columns: [{ key: 'time', header: { main: '時刻', alt: 'Time' }, kind: 'time', sourceField: 'depart_time' }],
		presets: { types: [{ main: '快速', alt: 'Rapid' }] },
		rows: [{ depart_time: '10:00' }],
		ui: { rows: 6, mode: 'departures' }
	};
	const output = normalizeBoardConfig(input);
	assert.equal(output.schema_version, 3);
	assert.equal(output.columns.length, 1);
	assert.equal(output.columns[0].key, 'time');
	assert.equal(output.rows.length, 1);
	assert.equal(output.rows[0].depart_time, '10:00');
	assert.equal(output.ui.mode, 'departures');
	assert.equal(output.ui.rows, 6);
	console.log('  v3 passthrough preserves columns, presets, rows, ui');
}

function test_emptyInput_returnsEmptyConfig() {
	const output = normalizeBoardConfig(null);
	assert.equal(output.schema_version, 3);
	assert.deepEqual(output.columns, []);
	assert.deepEqual(output.presets, {});
	assert.deepEqual(output.rows, []);
	assert.deepEqual(output.ui, {});
	console.log('  null input returns empty config');
}

function test_nonObjectInput_returnsEmptyConfig() {
	assert.deepEqual(normalizeBoardConfig('bad').columns, []);
	assert.deepEqual(normalizeBoardConfig(42).columns, []);
	assert.deepEqual(normalizeBoardConfig(undefined).columns, []);
	assert.deepEqual(normalizeBoardConfig([]).columns, []);
	console.log('  non-object input returns empty config');
}

function test_partialInput_usesDefaults() {
	const output = normalizeBoardConfig({ schema_version: 3, columns: [], rows: [] });
	assert.deepEqual(output.presets, {});
	assert.deepEqual(output.ui, {});
	console.log('  partial input uses defaults for missing fields');
}

function test_nullPresets_returnsEmpty() {
	const r = normalizeBoardConfig({ schema_version: 3, columns: [], presets: null, rows: [] });
	assert.deepEqual(r.presets, {});
	console.log('  null presets returns empty object');
}

function test_uiPreserved() {
	const r = normalizeBoardConfig({ schema_version: 3, columns: [], rows: [], ui: { mode: 'gate', rows: 4, cascadeMs: 500 } });
	assert.equal(r.ui.mode, 'gate');
	assert.equal(r.ui.rows, 4);
	assert.equal(r.ui.cascadeMs, 500);
	console.log('  ui values preserved as-is');
}

console.log('normalizeBoardConfig:');
test_v3_passthrough_preservesInput();
test_emptyInput_returnsEmptyConfig();
test_nonObjectInput_returnsEmptyConfig();
test_partialInput_usesDefaults();
test_nullPresets_returnsEmpty();
test_uiPreserved();
console.log('normalizeBoardConfig tests passed');
