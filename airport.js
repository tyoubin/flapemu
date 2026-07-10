import { prepareBoardData } from './js/board-pipeline.js';
import { mountBoard } from './js/flapemu.js';
import { setFavicon } from './js/utils.js';

const DATA_SOURCE = './timetable/narita.json';

let boardInstance = null;
let refreshTimerId = null;

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

		if (!boardInstance) {
			const meta = json.meta;
			if (meta && meta.header) {
				renderTopBar(meta.header);
			}

			const headerData = json.meta ? json.meta.header : null;
			if (headerData) {
				if (headerData.line_name && headerData.for) {
					document.title = `${headerData.line_name.local} ${headerData.for.local}`;
				}
				if (headerData.logo_url) setFavicon(headerData.logo_url);
			}

			boardInstance = mountBoard(board, config);
		} else {
			if (config.rows && config.rows.length > 0) {
				boardInstance.updateBoard(config.presets, config.rows);
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
