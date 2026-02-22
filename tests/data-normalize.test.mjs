import assert from 'node:assert/strict';
import { CURRENT_SCHEMA_VERSION, normalizeTimetable } from '../js/data-normalize.js';

function testCanonicalInputPassesThrough() {
	const input = {
		schema_version: 2,
		meta: {
			header: {
				logo_url: 'timetable/custom.svg',
				line_name: { local: '東海道', en: 'Tokaido' },
				for: { local: '新大阪方面', en: 'for Shin-Osaka' }
			}
		},
		presets: {
			types: [{ local: '快速', en: 'Rapid', color: '#123456', textColor: '#ffffff' }],
			dests: [{ local: '東京', en: 'Tokyo' }],
			remarks: [{ local: '自由席', en: 'Non-Reserved' }],
			stops: [{ local: '各駅停車', en: 'All Stops' }]
		},
		schedule: [{
			track_no: '1',
			type: { local: '快速', en: 'Rapid' },
			type_color_hex: '#123456',
			type_text_color: '#ffffff',
			train_no: '101',
			depart_time: '08:30',
			destination: { local: '東京', en: 'Tokyo' },
			remarks: { local: '自由席', en: 'Non-Reserved' },
			stops_at: { local: '各駅停車', en: 'All Stops' }
		}]
	};

	const output = normalizeTimetable(input);
	assert.equal(output.schema_version, 2);
	assert.equal(output.meta.header.logo_url, 'timetable/custom.svg');
	assert.equal(output.schedule[0].depart_time, '08:30');
	assert.equal(output.schedule[0].destination.local, '東京');
}

function testLegacyArrayInputIsSupported() {
	const input = [{
		track: '11',
		kind: 'EXP',
		type_color: '#ff0000',
		type_text_color_hex: '#000000',
		no: 'A12',
		time: '09:05',
		to: 'Hakata',
		note: 'Boarding soon',
		stop: 'Kokura'
	}];

	const output = normalizeTimetable(input);
	assert.equal(output.schema_version, 1);
	assert.equal(output.schedule.length, 1);
	assert.equal(output.schedule[0].track_no, '11');
	assert.equal(output.schedule[0].train_no, 'A12');
	assert.equal(output.schedule[0].depart_time, '09:05');
	assert.equal(output.schedule[0].type.local, 'EXP');
	assert.equal(output.schedule[0].destination.local, 'Hakata');
	assert.equal(output.schedule[0].remarks.local, 'Boarding soon');
	assert.equal(output.schedule[0].stops_at.local, 'Kokura');
}

function testAliasMappingOnObjectInput() {
	const input = {
		meta: {},
		presets: {},
		schedule: [{
			track: '7',
			train_type: { local: '特急', en: 'Limited Express' },
			type_color: '#111111',
			type_text_color_hex: '#eeeeee',
			no: '77',
			time: '12:45',
			dest: { local: '博多', en: 'Hakata' },
			remark: '指定席',
			stops: '主要駅'
		}]
	};

	const output = normalizeTimetable(input);
	const row = output.schedule[0];

	assert.equal(output.schema_version, CURRENT_SCHEMA_VERSION);
	assert.equal(row.track_no, '7');
	assert.equal(row.type.local, '特急');
	assert.equal(row.type_color_hex, '#111111');
	assert.equal(row.type_text_color, '#eeeeee');
	assert.equal(row.train_no, '77');
	assert.equal(row.depart_time, '12:45');
	assert.equal(row.destination.en, 'Hakata');
	assert.equal(row.remarks.local, '指定席');
	assert.equal(row.stops_at.local, '主要駅');
}

function testDefaultsForMalformedInput() {
	const output = normalizeTimetable({ bad: 'shape' });

	assert.equal(output.schema_version, CURRENT_SCHEMA_VERSION);
	assert.deepEqual(output.presets.types, []);
	assert.deepEqual(output.schedule, []);
	assert.equal(output.meta.header.logo_url, 'timetable/logo.svg');
	assert.equal(output.meta.header.line_name.local, '');
}

testCanonicalInputPassesThrough();
testLegacyArrayInputIsSupported();
testAliasMappingOnObjectInput();
testDefaultsForMalformedInput();

console.log('data-normalize compatibility tests passed');
