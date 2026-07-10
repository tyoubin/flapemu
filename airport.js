import { sleep, calculateVisualLength, setFavicon } from './js/utils.js';
import { RowGroup } from './js/RowGroup.js';
import { prepareBoardData, selectDisplayRows } from './js/board-pipeline.js';

const DATA_SOURCE = './timetable/narita.json';

let groups = [];
let isInitialized = false;
let refreshTimerId = null;

function renderHeaderRow(columns) {
	const headerRow = document.getElementById('header-row');
	if (!headerRow) return;
	headerRow.innerHTML = '';
	columns.forEach((column) => {
		const item = document.createElement('div');
		item.className = `${column.cssClass} header-item`;
		const local = document.createElement('span');
		local.textContent = column.header.local;
		const en = document.createElement('span');
		en.textContent = column.header.en;
		item.appendChild(local);
		item.appendChild(en);
		headerRow.appendChild(item);
	});
}

function renderTopBar(meta) {
	let topBar = document.querySelector('.top-bar');
	if (!topBar) {
		topBar = document.createElement('div');
		topBar.className = 'top-bar';
		const container = document.querySelector('.main-container') || document.body;
		container.insertBefore(topBar, container.firstChild);
	}
	topBar.innerHTML = `
		<div class="header-logo-section" id="header-logo"></div>
		<div class="header-info-section">
			<div class="header-line-name">
				<span class="header-text-local" id="header-line-local"></span>
				<span class="header-text-en" id="header-line-en"></span>
			</div>
			<div class="header-direction">
				<span class="header-text-local" id="header-dest-local"></span>
				<span class="header-text-en" id="header-dest-en"></span>
			</div>
		</div>
	`;

	const elLineLocal = document.getElementById('header-line-local');
	const elLineEn = document.getElementById('header-line-en');
	if (elLineLocal) elLineLocal.textContent = meta.line_name?.local || '';
	if (elLineEn) elLineEn.textContent = meta.line_name?.en || '';

	const elDestLocal = document.getElementById('header-dest-local');
	const elDestEn = document.getElementById('header-dest-en');
	if (elDestLocal) elDestLocal.textContent = meta.for?.local || '';
	if (elDestEn) elDestEn.textContent = meta.for?.en || '';

	const elLogo = document.getElementById('header-logo');
	setHeaderLogo(elLogo, meta.logo_url);
}

function setHeaderLogo(elLogo, logoUrl) {
	if (!elLogo) return;
	if (!logoUrl) {
		const existing = elLogo.querySelector('img');
		if (existing) elLogo.removeChild(existing);
		elLogo.style.display = 'flex';
		return;
	}
	let img = elLogo.querySelector('img');
	if (!img) {
		img = document.createElement('img');
		img.alt = 'Airport Logo';
		elLogo.replaceChildren(img);
	}
	const nextHref = new URL(logoUrl, window.location.href).href;
	if (img.src !== nextHref) img.setAttribute('src', logoUrl);
	elLogo.style.display = 'flex';
}

async function fetchData() {
	try {
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.remove('board-error');
		if (statusEl) statusEl.innerHTML = '';

		const response = await fetch(DATA_SOURCE, { cache: 'no-store' });
		if (!response.ok) throw new Error('Network response was not ok');
		const json = await response.json();

		const config = prepareBoardData(json);
		const { presets, rows, columns, ui } = config;

		const hiddenColumns = new Set(ui.hiddenColumns || []);
		const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));
		const rowCount = ui.rows || 8;
		const timeField = (ui.window && ui.window.timeField) || 'depart_time';

		if (!isInitialized) {
			document.body.classList.add(`mode-${ui.mode || 'departures'}`);
			renderHeaderRow(visibleColumns);

			const meta = json.meta;
			if (meta && meta.header) {
				renderTopBar(meta.header);
			}
		}

		const dynamicWidthColumns = columns.filter(col => col.kind === 'word' && col.widthVar);
		dynamicWidthColumns.forEach((column) => {
			const fullList = [...(presets[column.presetKey || column.preset] || [])];
			let maxLen = 0;
			fullList.forEach(item => {
				const visualLength = calculateVisualLength(item.local);
				if (visualLength > maxLen) maxLen = visualLength;
			});
			if (maxLen < column.minChars) maxLen = column.minChars;
			const pixelWidth = Math.ceil((maxLen * 32) + 20);
			document.documentElement.style.setProperty(column.widthVar, `${pixelWidth}px`);
		});

		const headerData = json.meta ? json.meta.header : null;
		if (headerData) {
			if (headerData.line_name && headerData.for) {
				document.title = `${headerData.line_name.local} ${headerData.for.local}`;
			}
			if (headerData.logo_url) setFavicon(headerData.logo_url);
		}

		if (!isInitialized) {
			const rowsContainer = document.getElementById('board-rows');
			if (rowsContainer) {
				rowsContainer.innerHTML = '';
				for (let i = 0; i < rowCount; i++) {
					groups.push(new RowGroup(rowsContainer, presets, rows, visibleColumns));
				}
				isInitialized = true;
			}
		} else {
			groups.forEach(g => g.updatePhysicalLists(presets, rows));
		}

		if (!rows || rows.length === 0) return;

		const displayRows = selectDisplayRows(rows, rowCount, timeField, new Date());
		const cascadeMs = ui.cascadeMs || 800;
		for (let i = 0; i < rowCount; i++) {
			if (groups[i]) {
				groups[i].update(displayRows[i]);
				if (i < rowCount - 1) await new Promise(r => setTimeout(r, cascadeMs));
			}
		}
	} catch (e) {
		console.error('Error fetching data:', e);
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.add('board-error');
		if (statusEl) {
			statusEl.innerHTML = `
				<div class="status-text status-error">
					<div class="status-main">ただいま調整中 / System Adjustment</div>
					<div class="status-description">表示の更新を停止しています。アナウンスにご注意ください。<br>Display update paused. Please refer to announcements.</div>
				</div>
			`;
		}
	}
}

window.addEventListener('load', () => {
	fetchData();
	refreshTimerId = setInterval(fetchData, 30000);
});