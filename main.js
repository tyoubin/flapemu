import { DATA_SOURCE, PREVIEW_MODE, ROW_COUNT } from './js/config.js';
import { sleep, calculateVisualLength } from './js/utils.js';
import { TrainGroup } from './js/TrainGroup.js';

let groups = [];
let isInitialized = false;

async function fetchData() {
	try {
		// Clear Previous Error State
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.remove('board-error');
		if (statusEl) statusEl.innerHTML = '';

		let json;

		if (PREVIEW_MODE) {
			const previewData = sessionStorage.getItem('flapemu_preview');
			if (previewData) {
				console.log('[System] Loading preview data from editor...');
				json = JSON.parse(previewData);
			} else {
				console.warn('[System] Preview mode but no data found in sessionStorage');
				return;
			}
		} else {
			console.log(`[System] Fetching ${DATA_SOURCE}...`);
			const response = await fetch(DATA_SOURCE, { cache: "no-store" });
			if (!response.ok) throw new Error("API Network response was not ok");
			json = await response.json();
		}

		const scheduleData = Array.isArray(json) ? json : json.schedule;
		const presetsData = Array.isArray(json) ? {} : json.presets;
		const metaData = Array.isArray(json) ? {} : (json.meta || {});

		// Auto-Layout
		const extractFromSchedule = (schedule, key) => {
			if (!schedule) return [];
			return schedule.map(item => {
				if (item[key] && item[key].local) return item[key];
				return { local: "" };
			});
		};

		const adjustColumnWidth = (cssVar, presetList, scheduleList, minChars = 4) => {
			const fullList = [...(presetList || []), ...(scheduleList || [])];
			if (fullList.length === 0) return;

			let maxLen = 0;
			fullList.forEach(item => {
				const visualLength = calculateVisualLength(item.local);
				if (visualLength > maxLen) maxLen = visualLength;
			});

			if (maxLen < minChars) maxLen = minChars;
			const pixelWidth = Math.ceil((maxLen * 32) + 20);
			document.documentElement.style.setProperty(cssVar, `${pixelWidth}px`);
		};

		adjustColumnWidth('--col-type-width', presetsData.types, extractFromSchedule(scheduleData, 'type'), 4);
		adjustColumnWidth('--col-dest-width', presetsData.dests, extractFromSchedule(scheduleData, 'destination'), 5);
		adjustColumnWidth('--col-rem-width', presetsData.remarks, extractFromSchedule(scheduleData, 'remarks'), 6);
		adjustColumnWidth('--col-stop-width', presetsData.stops, extractFromSchedule(scheduleData, 'stops_at'), 4);

		// Browser Tab Title
		if (metaData.station_name || metaData.line_name) {
			const sName = metaData.station_name || "";
			const lName = metaData.line_name || "";
			document.title = `${sName} ${lName}`;
		} else {
			document.title = "FlapEmu";
		}

		const lineName = metaData.line_name || "DEPARTURES";
		const leftTitle = document.getElementById('line-name-left');
		if (leftTitle) leftTitle.textContent = lineName;

		if (!isInitialized) {
			console.log("[System] Initializing Board...");
			const rowsContainer = document.getElementById('board-rows');
			if (rowsContainer) {
				rowsContainer.innerHTML = "";
				for (let i = 0; i < ROW_COUNT; i++) {
					groups.push(new TrainGroup(rowsContainer, presetsData, scheduleData));
				}
				isInitialized = true;
			}
		} else {
			groups.forEach(g => g.updatePhysicalLists(presetsData, scheduleData));
		}

		if (!scheduleData || scheduleData.length === 0) return;

		scheduleData.sort((a, b) => a.depart_time.localeCompare(b.depart_time));

		const now = new Date();
		const currentHM = now.getHours() * 60 + now.getMinutes();

		let startIndex = scheduleData.findIndex(train => {
			const [h, m] = train.depart_time.split(':').map(Number);
			return (h * 60 + m) >= currentHM;
		});

		if (startIndex === -1) startIndex = 0;

		const displayTrains = [];
		for (let i = 0; i < ROW_COUNT; i++) {
			let dataIndex = (startIndex + i) % scheduleData.length;
			displayTrains.push(scheduleData[dataIndex]);
		}

		for (let i = 0; i < ROW_COUNT; i++) {
			if (groups[i]) {
				groups[i].update(displayTrains[i]);
				if (i < ROW_COUNT - 1) {
					await sleep(1000);
				}
			}
		}

	} catch (e) {
		console.error("Error fetching data:", e);
		// Visual Error Handling
		const board = document.getElementById('board');
		const statusEl = document.getElementById('system-status');
		if (board) board.classList.add('board-error');
		if (statusEl) {
			statusEl.innerHTML = `<span class="status-text status-error">⚠ CONNECTION LOST</span>`;
		}
	}
}

window.addEventListener('load', () => {
	fetchData();
	setInterval(() => {
		console.log(`[Auto-Update] Fetching...`);
		fetchData();
	}, 30000);
});
