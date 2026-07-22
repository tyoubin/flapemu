import assert from 'node:assert/strict';
import { mountBoard } from '../js/index.js';

class MockElement {
	constructor() {
		this.className = '';
		this.classList = {
			add: (c) => { this.className += ` ${c}`; },
			remove: (c) => { this.className = this.className.replace(c, ''); }
		};
		this.style = {
			setProperty: (k, v) => { this.style[k] = v; }
		};
		this.children = [];
		this.innerHTML = '';
	}
	appendChild(child) {
		this.children.push(child);
		return child;
	}
	querySelector(selector) {
		return new MockElement();
	}
	querySelectorAll(selector) {
		return [];
	}
	addEventListener() {}
	removeEventListener() {}
}

global.document = {
	createElement: () => new MockElement()
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

function test_mountAndLifecycle() {
	const container = new MockElement();
	const config = {
		schema_version: 3,
		columns: [
			{ key: 'time', kind: 'time', sourceField: 'depart_time' },
			{ key: 'dest', kind: 'word', sourceField: 'destination', presetKey: 'dests', widthVar: '--col-dest-width' }
		],
		presets: {
			dests: [{ main: '東京', alt: 'TOKYO' }, { main: '大阪', alt: 'OSAKA' }]
		},
		rows: [
			{ depart_time: '09:00', destination: { main: '東京', alt: 'TOKYO' } }
		],
		ui: {
			rows: 2,
			mode: 'concourse',
			flapAnimationMs: 300
		}
	};

	const instance = mountBoard(container, config);
	assert.equal(typeof instance.updateBoard, 'function');
	assert.equal(typeof instance.destroyBoard, 'function');
	assert.ok(container.children.length > 0);

	// Test updateBoard
	instance.updateBoard({ dests: [{ main: '大阪', alt: 'OSAKA' }] }, [
		{ depart_time: '10:00', destination: { main: '大阪', alt: 'OSAKA' } }
	]);

	// Test destroyBoard
	instance.destroyBoard();
	assert.equal(container.innerHTML, '');

	console.log('mountBoard lifecycle tests passed');
}

test_mountAndLifecycle();
