import { BLANK_DATA } from './config.js';
import { DEFAULT_DISPLAY_MODE, getNumericCharset, getVisibleColumns } from './board-schema.js';
import { getCap } from './utils.js';
import { CharFlap, WordFlap } from './FlapUnit.js';

export class TrainGroup {
	constructor(container, presets, scheduleData, columns = getVisibleColumns(DEFAULT_DISPLAY_MODE)) {
		this.groupEl = document.createElement('div');
		this.groupEl.className = 'train-group';
		container.appendChild(this.groupEl);

		this.rowPrimary = document.createElement('div');
		this.rowPrimary.className = 'row-primary';
		this.groupEl.appendChild(this.rowPrimary);

		this.columns = columns;
		this.controllers = {};

		const safePresets = presets || {};
		const actualByField = this.buildActualByField(scheduleData);

		this.columns.forEach((column) => {
			const colElement = this.createCol(this.rowPrimary, column.cssClass);
			this.controllers[column.key] = this.buildController(column, colElement, safePresets, actualByField);
		});
	}

	buildActualByField(scheduleData) {
		const output = {};
		if (!Array.isArray(scheduleData)) return output;

		this.columns.forEach((column) => {
			if (column.kind !== 'word') return;
			output[column.sourceField] = scheduleData
				.map(item => item[column.sourceField])
				.filter(item => item && item.local);
		});
		return output;
	}

	buildController(column, parent, safePresets, actualByField) {
		if (column.kind === 'chars') {
			const units = [];
			for (let i = 0; i < column.unitCount; i++) {
				units.push(new CharFlap(parent, column.charset, column.unitCapacity));
			}
			return { kind: 'chars', units };
		}

		if (column.kind === 'time') {
			const units = [];
			const nums = getNumericCharset();
			units.push(new CharFlap(parent, nums, column.unitCapacity));
			units.push(new CharFlap(parent, nums, column.unitCapacity));
			const separator = new CharFlap(parent, ":", 1);
			separator.setTarget(":");
			units.push(separator);
			units.push(new CharFlap(parent, nums, column.unitCapacity));
			units.push(new CharFlap(parent, nums, column.unitCapacity));
			return { kind: 'chars', units };
		}

		if (column.kind === 'word') {
			const presetList = safePresets[column.presetKey];
			const actualList = actualByField[column.sourceField] || [];
			return {
				kind: 'word',
				unit: new WordFlap(parent, presetList, actualList, getCap(presetList, actualList))
			};
		}

		return null;
	}

	createCol(row, cssClass) {
		const col = document.createElement('div');
		col.className = cssClass;
		row.appendChild(col);
		return col;
	}

	update(record) {
		this.columns.forEach((column) => {
			const controller = this.controllers[column.key];
			if (!controller) return;

			if (column.kind === 'chars') {
				const raw = (record[column.sourceField] || "").toString();
				const padded = raw.padEnd(column.padEnd || raw.length, ' ');
				this.updateChars(controller, padded);
				return;
			}

			if (column.kind === 'time') {
				this.updateChars(controller, (record[column.sourceField] || "").toString());
				return;
			}

			if (column.kind === 'word') {
				let payload = record[column.sourceField];
				if (column.keepTypeColors && record.type) {
					payload = {
						local: record.type.local,
						en: record.type.en,
						color: record.type_color_hex,
						textColor: record.type_text_color
					};
				}
				this.updateWord(controller, payload);
			}
		});
	}

	updateChars(controller, txt) {
		if (!controller || !txt) return;
		txt.split('').forEach((char, i) => {
			if (controller.units[i]) controller.units[i].setTarget(char);
		});
	}

	updateWord(controller, dataObj) {
		if (!controller) return;
		const target = dataObj || BLANK_DATA;
		controller.unit.setTarget(target);
	}

	updatePhysicalLists(presets, scheduleData) {
		const safePresets = presets || {};
		const actualByField = this.buildActualByField(scheduleData);

		this.columns.forEach((column) => {
			if (column.kind !== 'word') return;
			const controller = this.controllers[column.key];
			if (!controller) return;

			const presetList = safePresets[column.presetKey];
			const actualList = actualByField[column.sourceField] || [];
			controller.unit.updateList(presetList, actualList, getCap(presetList, actualList));
		});
	}
}
