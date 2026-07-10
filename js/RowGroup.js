import { getNumericCharset } from './board-schema.js';
import { buildActualWordMap, getColumnTarget } from './record-transform.js';
import { getCap } from './utils.js';
import { CharFlap, WordFlap } from './FlapUnit.js';

export class RowGroup {
	constructor(container, presets, scheduleData, columns = [], blankData) {
		this.groupEl = document.createElement('div');
		this.groupEl.className = 'row-group train-group';
		container.appendChild(this.groupEl);

		this.rowPrimary = document.createElement('div');
		this.rowPrimary.className = 'row-primary';
		this.groupEl.appendChild(this.rowPrimary);

		this.columns = columns;
		this.controllers = {};
		this.blankData = blankData;

		const safePresets = presets || {};
		const actualByField = buildActualWordMap(this.columns, scheduleData);

		this.columns.forEach((column) => {
			const colElement = this.createCol(this.rowPrimary, column.cssClass, column.inlineStyle);
			this.controllers[column.key] = this.buildController(column, colElement, safePresets, actualByField);
		});
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
			const sep = column.timeSeparator || ":";
			units.push(new CharFlap(parent, nums, column.unitCapacity));
			units.push(new CharFlap(parent, nums, column.unitCapacity));
			const separator = new CharFlap(parent, sep, 1);
			separator.setTarget(sep);
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
				unit: new WordFlap(parent, presetList, actualList, getCap(presetList, actualList), this.blankData, column.textAlign)
			};
		}

		return null;
	}

	createCol(row, cssClass, inlineStyle) {
		const col = document.createElement('div');
		col.className = cssClass;
		if (inlineStyle) col.style.cssText = inlineStyle;
		row.appendChild(col);
		return col;
	}

	update(record) {
		this.columns.forEach((column) => {
			const controller = this.controllers[column.key];
			if (!controller) return;
			const target = getColumnTarget(column, record);

			if (column.kind === 'chars' || column.kind === 'time') {
				this.updateChars(controller, target);
				return;
			}

			if (column.kind === 'word') {
				this.updateWord(controller, target);
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
		const target = dataObj || this.blankData;
		controller.unit.setTarget(target);
	}

	updatePhysicalLists(presets, scheduleData) {
		const safePresets = presets || {};
		const actualByField = buildActualWordMap(this.columns, scheduleData);

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
