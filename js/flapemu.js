import { selectDisplayRows } from './board-pipeline.js';
import { extractScheduleWords } from './train-pipeline.js';
import { sleep, calculateVisualLength } from './utils.js';
import { LAYOUT_WIDTH_MULTIPLIER, LAYOUT_WIDTH_PADDING, makeBlankData } from './config.js';
import { RowGroup } from './RowGroup.js';

function columnLayoutStyle(col) {
	if (col.inlineStyle) return col.inlineStyle;
	if (col.kind === 'time') {
		return 'flex: 0 0 auto; width: calc((var(--char-width) + 2px) * 5 - 2px); justify-content: center;';
	}
	if (col.kind === 'chars') {
		const n = col.unitCount || 4;
		return `flex: 0 0 auto; width: calc((var(--char-width) + 2px) * ${n} - 2px); justify-content: center;`;
	}
	if (col.kind === 'word' && col.widthVar) {
		const grow = col.flexGrow || 1;
		return `flex: ${grow} 1 var(${col.widthVar}, 200px);`;
	}
	return '';
}

export function mountBoard(el, config) {
	const { presets, rows, columns, ui } = config;

	const displayMode = ui.mode || 'concourse';
	const hiddenColumns = new Set(ui.hiddenColumns || []);
	const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));
	const rowCount = ui.rows || 12;

	const blankData = makeBlankData(ui.blankColor, ui.blankTextColor);

	visibleColumns.forEach(col => {
		col.cssClass = col.cssClass || `col-${col.kind}`;
		if (!col.inlineStyle) {
			col.inlineStyle = columnLayoutStyle(col);
		}
	});

	el.classList.add(`mode-${displayMode}`);
	el.innerHTML = '';

	if (ui.flapAnimationMs) {
		el.style.setProperty('--flap-speed', `${ui.flapAnimationMs / 1000}s`);
	}
	if (ui.colGap) {
		el.style.setProperty('--col-gap', ui.colGap);
	}
	if (ui.rowGap) {
		el.style.setProperty('--row-gap', ui.rowGap);
	}

	if (ui.showHeader !== false) {
		const headerRow = document.createElement('div');
		headerRow.className = 'header-row';
		el.appendChild(headerRow);

		visibleColumns.forEach((column) => {
			const item = document.createElement('div');
			item.className = `${column.cssClass} header-item`;
			item.style.cssText = column.inlineStyle;
			const local = document.createElement('span');
			local.textContent = column.header.local;
			const en = document.createElement('span');
			en.textContent = column.header.en;
			item.appendChild(local);
			item.appendChild(en);
			headerRow.appendChild(item);
		});
	}

	const rowsContainer = document.createElement('div');
	rowsContainer.id = 'board-rows';
	el.appendChild(rowsContainer);

	const dynamicWidthColumns = columns.filter(col => col.kind === 'word' && col.widthVar);
	dynamicWidthColumns.forEach((column) => {
		const fullList = [...(presets[column.presetKey] || []), ...extractScheduleWords(rows, column.sourceField)];
		if (fullList.length === 0) return;
		let maxLen = 0;
		fullList.forEach(item => {
			const len = calculateVisualLength(item.local);
			if (len > maxLen) maxLen = len;
		});
		const minChars = column.minChars || 4;
		if (maxLen < minChars) maxLen = minChars;
		const pixelWidth = Math.ceil((maxLen * LAYOUT_WIDTH_MULTIPLIER) + LAYOUT_WIDTH_PADDING);
		el.style.setProperty(column.widthVar, `${pixelWidth}px`);
	});

	const groups = [];
	for (let i = 0; i < rowCount; i++) {
		groups.push(new RowGroup(rowsContainer, presets, rows, visibleColumns, blankData));
	}

	async function cascadeUpdate(displayRows) {
		const cascadeMs = ui.cascadeMs || 1000;
		for (let i = 0; i < rowCount; i++) {
			if (groups[i]) {
				groups[i].update(displayRows[i]);
				if (i < rowCount - 1) {
					await sleep(cascadeMs);
				}
			}
		}
	}

	const timeField = (ui.window && ui.window.timeField) || 'depart_time';
	const initialRows = selectDisplayRows(rows, rowCount, timeField, new Date());
	setTimeout(() => cascadeUpdate(initialRows), 0);

	return {
		updateBoard(newPresets, newRows) {
			groups.forEach(g => g.updatePhysicalLists(newPresets, newRows));
			const selected = selectDisplayRows(newRows, rowCount, timeField, new Date());
			return cascadeUpdate(selected);
		},
		destroyBoard() {
			groups.length = 0;
			el.innerHTML = '';
			el.classList.remove(`mode-${displayMode}`);
		}
	};
}
