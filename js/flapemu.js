import { selectDisplayRows, extractFieldWords } from './board-pipeline.js';
import { sleep, calculateVisualLength } from './utils.js';
import { LAYOUT_WIDTH_MULTIPLIER, LAYOUT_WIDTH_PADDING, makeBlankData } from './config.js';
import { RowGroup } from './RowGroup.js';
import { normalizeBoardConfig } from './data-normalize.js';

function columnLayoutStyle(col) {
	if (col.inlineStyle) return col.inlineStyle;
	if (col.kind === 'time') {
		return 'flex: 0 0 auto; width: calc((var(--char-width) + 2px) * 5 - 2px); justify-content: center;';
	}
	if (col.kind === 'chars') {
		const n = col.unitCount || 4;
		return `flex: 0 0 auto; width: calc((var(--char-width) + 2px) * ${n} - 2px); justify-content: center;`;
	}
	if (col.fullWidth) {
		return 'flex: 1 1 100%; width: 100%;';
	}
	if (col.kind === 'word' && col.widthVar) {
		const grow = col.flexGrow || 1;
		return `flex: ${grow} 1 var(${col.widthVar}, 200px);`;
	}
	return '';
}

function resolveWindowOpts(ui) {
	const window = (ui && ui.window) || {};
	return {
		strategy: window.strategy || 'nextByTime',
		timeField: window.timeField || 'depart_time'
	};
}

export function mountBoard(el, config) {
	if (!el || typeof el.appendChild !== 'function') {
		throw new Error('mountBoard requires a valid DOM container element as the first argument');
	}
	if (!config || typeof config !== 'object' || Array.isArray(config)) {
		throw new Error('mountBoard requires a board configuration object as the second argument');
	}
	const { presets, rows, columns: rawColumns, ui } = normalizeBoardConfig(config);

	const displayMode = ui.mode || 'concourse';
	const hiddenColumns = new Set(ui.hiddenColumns || []);
	const rowCount = ui.rows || 12;
	const blankData = makeBlankData(ui.blankColor, ui.blankTextColor);
	const windowOpts = resolveWindowOpts(ui);

	// Clone layout fields so we never mutate the caller's column objects.
	const visibleColumns = rawColumns
		.filter(col => !hiddenColumns.has(col.key))
		.map(col => ({
			...col,
			cssClass: col.cssClass || `col-${col.kind}`,
			inlineStyle: col.inlineStyle || columnLayoutStyle(col)
		}));

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
	if (ui.charFontSize) {
		el.style.setProperty('--char-font', ui.charFontSize);
	}
	if (ui.mainFontSize) {
		el.style.setProperty('--local-font', ui.mainFontSize);
	}
	if (ui.altFontSize) {
		el.style.setProperty('--en-font', ui.altFontSize);
	}
	if (ui.charWidth) {
		el.style.setProperty('--char-width', ui.charWidth);
	}
	if (ui.charHeight) {
		el.style.setProperty('--char-height', ui.charHeight);
	}
	if (ui.fontFamily) {
		el.style.setProperty('--board-font-family', ui.fontFamily);
	}
	if (ui.borderRadius) {
		el.style.setProperty('--board-radius', ui.borderRadius);
	}
	if (ui.borderColor) {
		el.style.setProperty('--board-border-color', ui.borderColor);
	}
	if (ui.boardBg) {
		el.style.setProperty('--board-bg', ui.boardBg);
	}
	if (ui.headerFontFamily) {
		el.style.setProperty('--board-header-font-family', ui.headerFontFamily);
	}

	if (ui.showHeader !== false) {
		const headerRow = document.createElement('div');
		headerRow.className = 'header-row';
		el.appendChild(headerRow);

		visibleColumns.forEach((column) => {
			const item = document.createElement('div');
			item.className = `${column.cssClass} header-item`;
			item.style.cssText = column.inlineStyle;
			const main = document.createElement('span');
			main.textContent = column.header?.main ?? '';
			const alt = document.createElement('span');
			alt.textContent = column.header?.alt ?? '';
			item.appendChild(main);
			item.appendChild(alt);
			headerRow.appendChild(item);
		});
	}

	const rowsContainer = document.createElement('div');
	rowsContainer.id = 'board-rows';
	el.appendChild(rowsContainer);

	const dynamicWidthColumns = visibleColumns.filter(col => col.kind === 'word' && col.widthVar);
	dynamicWidthColumns.forEach((column) => {
		const fullList = [...(presets[column.presetKey] || []), ...extractFieldWords(rows, column.sourceField)];
		if (fullList.length === 0) return;
		let maxLen = 0;
		fullList.forEach(item => {
			const len = calculateVisualLength(item.main);
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

	const initialRows = selectDisplayRows(rows, rowCount, windowOpts, new Date());
	setTimeout(() => cascadeUpdate(initialRows), 0);

	return {
		updateBoard(newPresets, newRows) {
			groups.forEach(g => g.updatePhysicalLists(newPresets, newRows));
			const selected = selectDisplayRows(newRows, rowCount, windowOpts, new Date());
			return cascadeUpdate(selected);
		},
		destroyBoard() {
			groups.length = 0;
			el.innerHTML = '';
			el.classList.remove(`mode-${displayMode}`);
		}
	};
}
