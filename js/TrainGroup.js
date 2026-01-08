import { CHARS_NUM, CHARS_ALPHANUM, BLANK_DATA } from './config.js';
import { getCap } from './utils.js';
import { CharFlap, WordFlap } from './FlapUnit.js';

export class TrainGroup {
	constructor(container, presets, scheduleData) {
		this.groupEl = document.createElement('div');
		this.groupEl.className = 'train-group';
		container.appendChild(this.groupEl);

		this.rowPrimary = document.createElement('div');
		this.rowPrimary.className = 'row-primary';
		this.groupEl.appendChild(this.rowPrimary);

		this.controllers = {};

		const safePresets = presets || {};

		const extractActuals = (key) => {
			if (!scheduleData) return [];
			return scheduleData.map(item => item[key]).filter(x => x && x.local);
		};

		const actualTypes = extractActuals('type');
		const actualDests = extractActuals('destination');
		const actualRemarks = extractActuals('remarks');
		const actualStops = extractActuals('stops_at');

		// --- Init Flap Units ---

		this.createCol(this.rowPrimary, 'plat', 'col-plat', () => {
			let c = [];
			for (let i = 0; i < 3; i++) {
				c.push(new CharFlap(this.lastDiv, CHARS_ALPHANUM, 15));
			}
			return { type: 'chars', units: c };
		});

		this.createCol(this.rowPrimary, 'type', 'col-type', () => {
			return { type: 'word', unit: new WordFlap(this.lastDiv, safePresets.types, actualTypes, getCap(safePresets.types, actualTypes)) };
		});

		this.createCol(this.rowPrimary, 'no', 'col-no', () => {
			let c = [];
			for (let i = 0; i < 5; i++) {
				c.push(new CharFlap(this.lastDiv, CHARS_ALPHANUM, 50));
			}
			return { type: 'chars', units: c };
		});

		this.createCol(this.rowPrimary, 'time', 'col-time', () => {
			let c = [];
			c.push(new CharFlap(this.lastDiv, CHARS_NUM, 20)); c.push(new CharFlap(this.lastDiv, CHARS_NUM, 20));
			let s = new CharFlap(this.lastDiv, ":", 1); s.setTarget(":"); c.push(s);
			c.push(new CharFlap(this.lastDiv, CHARS_NUM, 20)); c.push(new CharFlap(this.lastDiv, CHARS_NUM, 20));
			return { type: 'chars', units: c };
		});

		this.createCol(this.rowPrimary, 'dest', 'col-dest', () => {
			return { type: 'word', unit: new WordFlap(this.lastDiv, safePresets.dests, actualDests, getCap(safePresets.dests, actualDests)) };
		});

		this.createCol(this.rowPrimary, 'remarks', 'col-remarks', () => {
			return { type: 'word', unit: new WordFlap(this.lastDiv, safePresets.remarks, actualRemarks, getCap(safePresets.remarks, actualRemarks)) };
		});

		this.createCol(this.rowPrimary, 'stop', 'col-stop', () => {
			return { type: 'word', unit: new WordFlap(this.lastDiv, safePresets.stops, actualStops, getCap(safePresets.stops, actualStops)) };
		});
	}

	createCol(row, key, css, factory) {
		this.lastDiv = document.createElement('div');
		this.lastDiv.className = css;
		row.appendChild(this.lastDiv);
		this.controllers[key] = factory();
	}

	update(record) {
		this.updateChars('plat', (record.track_no || "").toString().padEnd(3, ' '));

		let typeData = record.type ? {
			local: record.type.local,
			en: record.type.en,
			color: record.type_color_hex,
			textColor: record.type_text_color
		} : null;
		this.updateWord('type', typeData);
		this.updateChars('no', (record.train_no || "").toString().padEnd(5, ' '));
		this.updateChars('time', record.depart_time || "");
		this.updateWord('dest', record.destination);
		this.updateWord('remarks', record.remarks);
		this.updateWord('stop', record.stops_at);
	}

	updateChars(key, txt) {
		const c = this.controllers[key];
		if (c && txt) {
			txt.split('').forEach((char, i) => {
				if (c.units[i]) c.units[i].setTarget(char);
			});
		}
	}

	updateWord(key, dataObj) {
		const c = this.controllers[key];
		const target = dataObj || BLANK_DATA;
		if (c) c.unit.setTarget(target);
	}

	updatePhysicalLists(presets, scheduleData) {
		const extractActuals = (key) => {
			if (!scheduleData) return [];
			return scheduleData.map(item => item[key]).filter(x => x && x.local);
		};

		const safePresets = presets || {};
		const actualTypes = extractActuals('type');
		const actualDests = extractActuals('destination');
		const actualRemarks = extractActuals('remarks');
		const actualStops = extractActuals('stops_at');

		if (this.controllers['type']) {
			this.controllers['type'].unit.updateList(safePresets.types, actualTypes, getCap(safePresets.types, actualTypes));
		}
		if (this.controllers['dest']) {
			this.controllers['dest'].unit.updateList(safePresets.dests, actualDests, getCap(safePresets.dests, actualDests));
		}
		if (this.controllers['remarks']) {
			this.controllers['remarks'].unit.updateList(safePresets.remarks, actualRemarks, getCap(safePresets.remarks, actualRemarks));
		}
		if (this.controllers['stop']) {
			this.controllers['stop'].unit.updateList(safePresets.stops, actualStops, getCap(safePresets.stops, actualStops));
		}
	}
}
