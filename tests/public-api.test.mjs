import assert from 'node:assert/strict';
import { BOARD_CONFIG_VERSION, mountBoard, normalizeBoardConfig, validateBoardConfig } from '../js/index.js';

assert.equal(typeof mountBoard, 'function');
assert.equal(typeof normalizeBoardConfig, 'function');
assert.equal(typeof validateBoardConfig, 'function');
assert.equal(BOARD_CONFIG_VERSION, 3);

const normalized = normalizeBoardConfig({ columns: [], rows: null, ui: null });
assert.deepEqual(normalized, {
	schema_version: 3,
	columns: [],
	presets: {},
	rows: [],
	ui: {}
});

console.log('public API exports mountBoard and normalizes incomplete config');

assert.deepEqual(validateBoardConfig({
	 schema_version: 3,
	 columns: [{ key: 'time', kind: 'time', sourceField: 'depart_time' }, { key: 'dest', kind: 'word', sourceField: 'destination', presetKey: 'dests' }],
	 rows: [], presets: { dests: [{ main: 'TOKYO' }] }, ui: { rows: 4, window: { strategy: 'static' }, hiddenColumns: ['time'] }
}), { valid: true, errors: [] });
assert.equal(validateBoardConfig({ columns: [{ key: 'x', kind: 'bad', sourceField: '' }], ui: { rows: 0 } }).valid, false);

const errors = validateBoardConfig({
	columns: [{ key: 'x', kind: 'word', sourceField: 'dest', presetKey: 'missing' }],
	presets: { badPreset: 'not-array', invalidList: [null] },
	ui: { rows: 0, hiddenColumns: ['unknown'] }
}).errors;

assert.ok(errors.some(e => e.includes('presetKey "missing" references non-existent preset')));
assert.ok(errors.some(e => e.includes('presets.badPreset must be an array')));
assert.ok(errors.some(e => e.includes('presets.invalidList[0] must be an object')));
assert.ok(errors.some(e => e.includes('ui.hiddenColumns contains unknown key "unknown"')));

console.log('public API validates supported config fields and reports errors');
