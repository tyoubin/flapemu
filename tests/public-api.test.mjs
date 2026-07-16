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
	 columns: [{ key: 'time', kind: 'time', sourceField: 'depart_time' }],
	 rows: [], presets: {}, ui: { rows: 4, window: { strategy: 'static' } }
}), { valid: true, errors: [] });
assert.equal(validateBoardConfig({ columns: [{ key: 'x', kind: 'bad', sourceField: '' }], ui: { rows: 0 } }).valid, false);
assert.equal(validateBoardConfig({ columns: [{ key: 'x', kind: 'bad', sourceField: '' }], ui: { rows: 0 } }).errors.length, 3);
console.log('public API validates supported config fields and reports errors');
