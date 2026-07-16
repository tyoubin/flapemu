import assert from 'node:assert/strict';
import { BOARD_CONFIG_VERSION, mountBoard, normalizeBoardConfig } from '../js/index.js';

assert.equal(typeof mountBoard, 'function');
assert.equal(typeof normalizeBoardConfig, 'function');
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
