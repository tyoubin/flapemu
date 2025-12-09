// Helper function: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================= 1. CLOCK =================
function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.textContent = `${h}:${m}`;
}
setInterval(updateClock, 1000);
updateClock();

// ================= 2. CONFIGURATION =================
// Note: All SAMPLE_ constants have been removed and are now managed by JSON
const CHARS_NUM = " 0123456789";
const CHARS_ALPHANUM = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BLANK_DATA = { local: " ", en: " ", color: "#202020", textColor: "#f5f5f5" };

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);
// Default to reading timetable/demo.json for testing
const DATA_SOURCE = urlParams.get('eki') ? `./timetable/${urlParams.get('eki')}.json` : './timetable/demo.json';

// Global variables
let groups = [];
let isInitialized = false;
const ROW_COUNT = 6;

// ================= 3. FLAP =================

function createPhysicalList(sourceList, capacity) {
    // The sourceList here comes from the JSON presets
    let list = [BLANK_DATA];
    if (sourceList && Array.isArray(sourceList)) {
        sourceList.forEach(item => {
            list.push({
                ...item,
                color: item.color || "#202020",
                textColor: item.textColor || "#f5f5f5"
            });
        });
    }
    while (list.length < capacity) {
        list.push({ ...BLANK_DATA });
    }
    return list;
}

class FlapUnit {
    constructor(parentElement, cssClass, type) {
        this.element = document.createElement('div');
        this.element.className = `flap-unit ${cssClass}`;
        this.type = type;
        this.pointer = 0;
        this.targetPointer = 0;
        this.isAnimating = false;
        this.physicalList = [];

        this.element.innerHTML = `
            <div class="top"><div class="card-content"></div></div><div class="bottom"><div class="card-content"></div></div>
            <div class="flap front"><div class="card-content"></div></div><div class="flap back"><div class="card-content"></div></div>
        `;
        this.topContent = this.element.querySelector('.top .card-content');
        this.bottomContent = this.element.querySelector('.bottom .card-content');
        this.frontContent = this.element.querySelector('.flap.front .card-content');
        this.backContent = this.element.querySelector('.flap.back .card-content');
        parentElement.appendChild(this.element);
    }

    renderTo(container, data) {
        container.innerHTML = '';

        if (data.color && data.color !== "#202020") {
            container.style.backgroundColor = data.color;
        } else {
            container.style.backgroundColor = "";
        }

        if (data.textColor) {
            container.style.color = data.textColor;
            if (data.textColor === "#000000" || data.textColor === "#000") {
                container.style.textShadow = "none";
            } else {
                container.style.textShadow = "";
            }
        } else {
            container.style.color = "";
            container.style.textShadow = "";
        }

        if (this.type === 'char') {
            container.textContent = data;
        } else {
            const localDiv = document.createElement('div');
            localDiv.className = 'local-text';
            localDiv.textContent = data.local;

            const enDiv = document.createElement('div');
            enDiv.className = 'en-text';
            enDiv.textContent = data.en;

            if (data.textColor) {
                enDiv.style.color = data.textColor;
                if (data.textColor === "#000000") enDiv.style.opacity = "0.7";
            }

            container.appendChild(localDiv);
            container.appendChild(enDiv);
        }
    }

    setTarget(val) {
        let nextIndex = 0;

        if (this.type === 'char') {
            val = val.toString();
            nextIndex = this.physicalList.indexOf(val);
            if (nextIndex === -1) nextIndex = 0;
        } else {
            const targetLocal = val ? val.local : " ";
            if (targetLocal === " ") {
                nextIndex = 0;
            } else {
                nextIndex = this.physicalList.findIndex(item => item.local === targetLocal);
                if (nextIndex === -1) {
                    // Dynamic Insert
                    let freeSlotIndex = this.physicalList.findIndex((item, idx) => item.local === " " && idx !== 0);
                    if (freeSlotIndex === -1) {
                        freeSlotIndex = (this.pointer + 5) % this.physicalList.length;
                        if (freeSlotIndex === 0) freeSlotIndex = 1;
                    }
                    this.physicalList[freeSlotIndex] = {
                        local: val.local,
                        en: val.en,
                        color: val.color || "#202020",
                        textColor: val.textColor || "#f5f5f5"
                    };
                    nextIndex = freeSlotIndex;
                } else {
                    let item = this.physicalList[nextIndex];
                    if (val.color && item.color !== val.color) item.color = val.color;
                    if (val.textColor && item.textColor !== val.textColor) item.textColor = val.textColor;
                }
            }
        }

        this.targetPointer = nextIndex;
        if (this.pointer !== this.targetPointer && !this.isAnimating) this.step();
    }

    step() {
        let currentData = this.physicalList[this.pointer];
        this.pointer = (this.pointer + 1) % this.physicalList.length;
        let nextData = this.physicalList[this.pointer];

        this.element.classList.remove('flipping');
        void this.element.offsetWidth;
        this.isAnimating = true;
        this.element.classList.add('flipping');

        this.renderTo(this.topContent, nextData);
        this.renderTo(this.bottomContent, currentData);
        this.renderTo(this.frontContent, currentData);
        this.renderTo(this.backContent, nextData);

        setTimeout(() => {
            this.element.classList.remove('flipping');
            this.renderTo(this.frontContent, nextData);
            this.renderTo(this.bottomContent, nextData);
            if (this.pointer !== this.targetPointer) {
                requestAnimationFrame(() => this.step());
            } else {
                this.isAnimating = false;
            }
        }, 150); // Crucial: the JS interval (150ms) must be greater than the CSS animation duration (--flap-speed: 0.15s)
    }
}

class CharFlap extends FlapUnit {
    constructor(parent, chars, capacity) {
        super(parent, 'flap-char', 'char');
        let list = chars.split('');
        if (!list.includes(" ")) list.unshift(" ");
        while (list.length < capacity) list.push(" ");
        this.physicalList = list;
        this.renderTo(this.topContent, this.physicalList[0]);
        this.renderTo(this.bottomContent, this.physicalList[0]);
    }
}

class WordFlap extends FlapUnit {
    // Receive the presets array read from JSON
    constructor(parent, presetList, capacity) {
        super(parent, 'flap-word', 'word');
        this.physicalList = createPhysicalList(presetList, capacity);
        this.renderTo(this.topContent, this.physicalList[0]);
        this.renderTo(this.bottomContent, this.physicalList[0]);
    }
}

// ================= 4. ROW MANAGEMENT =================
class TrainGroup {
    // The constructor receives the presets object from JSON
    constructor(container, presets) {
        this.groupEl = document.createElement('div');
        this.groupEl.className = 'train-group';
        container.appendChild(this.groupEl);

        this.rowPrimary = document.createElement('div');
        this.rowPrimary.className = 'row-primary';
        this.groupEl.appendChild(this.rowPrimary);

        this.rowSecondary = document.createElement('div');
        this.rowSecondary.className = 'row-secondary';
        this.rowSecondary.innerHTML = `<div class="stops-label"><span>停車駅</span><span>Stops</span></div>`;
        this.groupEl.appendChild(this.rowSecondary);

        this.controllers = {};

        // Safety check: prevent errors if presets are not in JSON
        const safePresets = presets || {};
        const types = safePresets.types || [];
        const dests = safePresets.dests || [];
        const remarks = safePresets.remarks || [];
        const stops = safePresets.stops || [];

        // --- Initialize components, pass in JSON presets ---

        this.createCol(this.rowPrimary, 'plat', 'col-plat', () => {
            return { type: 'chars', units: [new CharFlap(this.lastDiv, CHARS_NUM, 15), new CharFlap(this.lastDiv, CHARS_NUM, 15)] };
        });

        // Train Type: use types from JSON
        this.createCol(this.rowPrimary, 'type', 'col-type', () => {
            return { type: 'word', unit: new WordFlap(this.lastDiv, types, 30) };
        });

        // Train No: use CHARS_ALPHANUM and create 5 units
        this.createCol(this.rowPrimary, 'no', 'col-no', () => {
            let c = [];
            for (let i = 0; i < 5; i++) {
                // Capacity 40 to accommodate A-Z + 0-9
                c.push(new CharFlap(this.lastDiv, CHARS_ALPHANUM, 40));
            }
            return { type: 'chars', units: c };
        });

        this.createCol(this.rowPrimary, 'time', 'col-time', () => {
            let c = [];
            c.push(new CharFlap(this.lastDiv, CHARS_NUM, 15)); c.push(new CharFlap(this.lastDiv, CHARS_NUM, 15));
            let s = new CharFlap(this.lastDiv, ":", 1); s.setTarget(":"); c.push(s);
            c.push(new CharFlap(this.lastDiv, CHARS_NUM, 15)); c.push(new CharFlap(this.lastDiv, CHARS_NUM, 15));
            return { type: 'chars', units: c };
        });

        // Destination: use dests from JSON
        this.createCol(this.rowPrimary, 'dest', 'col-dest', () => {
            return { type: 'word', unit: new WordFlap(this.lastDiv, dests, 50) };
        });

        // Seating/Facility/Other: use remarks from JSON
        this.createCol(this.rowPrimary, 'remarks', 'col-remarks', () => {
            return { type: 'word', unit: new WordFlap(this.lastDiv, remarks, 25) };
        });

        // Stops: use stops from JSON
        this.createCol(this.rowSecondary, 'stop', 'col-stop', () => {
            return { type: 'word', unit: new WordFlap(this.lastDiv, stops, 35) };
        });
    }

    createCol(row, key, css, factory) {
        this.lastDiv = document.createElement('div');
        this.lastDiv.className = css;
        row.appendChild(this.lastDiv);
        this.controllers[key] = factory();
    }

    update(record) {
        this.updateChars('plat', (record.track_no || "").padStart(2, ' '));

        let typeData = record.type ? {
            local: record.type.local,
            en: record.type.en,
            color: record.type_color_hex,
            textColor: record.type_text_color
        } : null;
        this.updateWord('type', typeData);

        // Train No: pad to 5 characters
        this.updateChars('no', (record.train_no || "").toString().padStart(5, ' '));

        this.updateChars('time', record.depart_time || "");
        this.updateWord('dest', record.destination);
        this.updateWord('remarks', record.remarks);
        this.updateWord('stop', record.stops_at);
    }

    updateChars(key, txt) {
        const c = this.controllers[key];
        if (c && txt) {
            txt.split('').forEach((char, i) => {
                setTimeout(() => { if (c.units[i]) c.units[i].setTarget(char); }, Math.random() * 50);
            });
        }
    }

    updateWord(key, dataObj) {
        const c = this.controllers[key];
        const target = dataObj || BLANK_DATA;
        if (c) setTimeout(() => c.unit.setTarget(target), Math.random() * 100);
    }
}

// ================= 5. MAIN =================
const boardEl = document.getElementById('board');

async function fetchData() {
    try {
        console.log(`[System] Fetching ${DATA_SOURCE}...`);
        const response = await fetch(DATA_SOURCE, { cache: "no-store" });
        if (!response.ok) throw new Error("API Network response was not ok");

        const json = await response.json();

        // Parse data
        const scheduleData = Array.isArray(json) ? json : json.schedule;
        const presetsData = Array.isArray(json) ? {} : json.presets;
        const metaData = Array.isArray(json) ? {} : (json.meta || {});

        // ============================================
        //  Auto-Layout
        // ============================================
        /**
         * Helper to calculate and set CSS variable for column width
         * @param {String} cssVar - The CSS variable name (e.g., '--col-type-width')
         * @param {Array} dataList - List of preset objects
         * @param {Number} minChars - Minimum character count safety
         */
        const adjustColumnWidth = (cssVar, dataList, minChars = 4) => {
            if (!dataList || dataList.length === 0) return;

            let maxLen = 0;
            dataList.forEach(item => {
                const text = item.local || "";
                // Calculate visual length: ASCII=0.6, Others=1.0
                let visualLength = 0;
                for (let char of text) {
                    if (char.charCodeAt(0) < 128) visualLength += 0.6;
                    else visualLength += 1;
                }
                if (visualLength > maxLen) maxLen = visualLength;
            });

            if (maxLen < minChars) maxLen = minChars;

            // Calculate pixels: (Length * Font Size) + Padding
            // 32 is a multiplier roughly based on the 30px font size + gaps
            const pixelWidth = Math.ceil((maxLen * 32) + 20);

            // Apply to CSS
            document.documentElement.style.setProperty(cssVar, `${pixelWidth}px`);
        };

        // 1. Calculate Type Column Width
        adjustColumnWidth('--col-type-width', presetsData.types, 4);

        // 2. Calculate Destination Column Width
        adjustColumnWidth('--col-dest-width', presetsData.dests, 5);

        // 3. Calculate Remarks Column Width
        adjustColumnWidth('--col-rem-width', presetsData.remarks, 6);

        // Browser Tab Title
        if (metaData.station_name || metaData.line_name) {
            const sName = metaData.station_name || "";
            const lName = metaData.line_name || "";
            document.title = `${sName} ${lName}`;
        } else {
            document.title = "FlapEmu";
        }

        // Update top title
        const lineName = metaData.line_name || "DEPARTURES";
        const leftTitle = document.getElementById('line-name-left');
        const rightTitle = document.getElementById('line-name-right');

        if (leftTitle) leftTitle.textContent = lineName;
        if (rightTitle) rightTitle.textContent = lineName;

        // On initial load, initialize the flipper based on the presets in the JSON
        if (!isInitialized) {
            console.log("[System] Initializing Board with Presets:", presetsData);

            const rowsContainer = document.getElementById('board-rows');
            rowsContainer.innerHTML = "";

            for (let i = 0; i < ROW_COUNT; i++) {
                groups.push(new TrainGroup(rowsContainer, presetsData));
            }
            isInitialized = true;
        }

        // --- Process timetable data ---
        if (!scheduleData || scheduleData.length === 0) return;

        // Sort
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

        // 4. Update the flipper by semi-iterating through each row
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
    }
}

window.onload = () => {
    fetchData();
    setInterval(() => {
        console.log(`[Auto-Update] Fetching...`);
        fetchData();
    }, 30000);
};
