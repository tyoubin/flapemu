// Helper function: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================= 1. Top bar =================
// to be implemented
// ================= 2. CONFIGURATION =================
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

/**
 * Create Physical List
 * Merges Presets + Actual Schedule Items + Blanks
 * Ensures uniqueness and maintains order (Presets first, then new schedule items)
 */
function createPhysicalList(presetList, actualList, capacity) {
    let list = [BLANK_DATA]; // Index 0 is always blank
    const seenLocals = new Set(); // To track duplicates based on 'local' string

    // Helper to process and append items
    const processItems = (sourceArray) => {
        if (!Array.isArray(sourceArray)) return;
        sourceArray.forEach(item => {
            // Only add valid items that haven't been added yet
            // Skip " " blanks here, they are handled by padding later
            if (item && item.local && item.local.trim() !== "" && !seenLocals.has(item.local)) {
                seenLocals.add(item.local);
                list.push({
                    local: item.local,
                    en: item.en,
                    color: item.color || "#202020",
                    textColor: item.textColor || "#f5f5f5"
                });
            }
        });
    };

    // 1. Load Presets (Simulates hardware factory settings)
    processItems(presetList);

    // 2. Load Actuals (Simulates dynamic daily schedule additions)
    processItems(actualList);

    // 3. Fill remaining capacity with BLANK cards
    while (list.length < capacity) {
        list.push({ ...BLANK_DATA });
    }

    // 4. Hard cap
    return list.slice(0, capacity);
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
            // Word
            const targetLocal = val ? val.local : " ";

            if (targetLocal === " " || targetLocal === "") {
                nextIndex = 0; // Default blank
            } else {
                // 1. Search in the pre-built physical list
                // Since we merged presets and actuals during init, it SHOULD be here.
                nextIndex = this.physicalList.findIndex(item => item.local === targetLocal);

                // 2. Safety Fallback: If still not found (e.g. data changed after init), inject dynamically
                if (nextIndex === -1) {
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
                    // Update style just in case
                    let item = this.physicalList[nextIndex];
                    if (val.color && item.color !== val.color) item.color = val.color;
                    if (val.textColor && item.textColor !== val.textColor) item.textColor = val.textColor;
                }
            }
        }

        this.targetPointer = nextIndex;
        if (this.pointer !== this.targetPointer && !this.isAnimating) {
            this.step();
        }
    }

    step() {
        let currentData = this.physicalList[this.pointer];
        this.pointer = (this.pointer + 1) % this.physicalList.length;
        let nextData = this.physicalList[this.pointer];

        this.element.classList.remove('flipping');
        void this.element.offsetWidth; // Force Reflow
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
    // Accepts both presetList and actualList
    constructor(parent, presetList, actualList, capacity) {
        super(parent, 'flap-word', 'word');
        this.physicalList = createPhysicalList(presetList, actualList, capacity);
        this.renderTo(this.topContent, this.physicalList[0]);
        this.renderTo(this.bottomContent, this.physicalList[0]);
    }
}

// ================= 4. ROW MANAGEMENT =================
class TrainGroup {
    // Accepts scheduleData to extract all possibilities
    constructor(container, presets, scheduleData) {
        this.groupEl = document.createElement('div');
        this.groupEl.className = 'train-group';
        container.appendChild(this.groupEl);

        this.rowPrimary = document.createElement('div');
        this.rowPrimary.className = 'row-primary';
        this.groupEl.appendChild(this.rowPrimary);

        this.controllers = {};

        const safePresets = presets || {};

        // Helper: Extract all unique objects from schedule for a given key
        // This ensures the flap unit knows about every possible value in the current schedule
        const extractActuals = (key) => {
            if (!scheduleData) return [];
            return scheduleData.map(item => item[key]).filter(x => x && x.local);
        };

        const actualTypes = extractActuals('type');
        const actualDests = extractActuals('destination');
        const actualRemarks = extractActuals('remarks');
        const actualStops = extractActuals('stops_at');
        // Dynamic Capacity Helper
        const getCap = (presets, actuals) => {
            // Deduplication
            const uniqueItems = new Set();
            if (presets) presets.forEach(p => uniqueItems.add(p.local));
            if (actuals) actuals.forEach(a => uniqueItems.add(a.local));
            const uniqueCount = uniqueItems.size;

            // add 15 blank cards
            let cap = uniqueCount + 15;

            // hard limit, ensure visual effect and not too long duration

            return Math.min(Math.max(cap, 40), 80);
        };
        // --- Init Flap Units ---

        this.createCol(this.rowPrimary, 'plat', 'col-plat', () => {
            let c = [];
            // Create  flap units using CHARS_ALPHANUM
            for (let i = 0; i < 3; i++) {
                c.push(new CharFlap(this.lastDiv, CHARS_ALPHANUM, 15));
            }
            return { type: 'chars', units: c };
        });

        // Type: Pass presets AND actuals
        this.createCol(this.rowPrimary, 'type', 'col-type', () => {
            return { type: 'word', unit: new WordFlap(this.lastDiv, safePresets.types, actualTypes, getCap(safePresets.types, actualTypes)) };
        });

        this.createCol(this.rowPrimary, 'no', 'col-no', () => {
            let c = [];
            for (let i = 0; i < 5; i++) {
                // alphanumeric chars
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

        // Destination: Pass presets AND actuals
        this.createCol(this.rowPrimary, 'dest', 'col-dest', () => {
            return { type: 'word', unit: new WordFlap(this.lastDiv, safePresets.dests, actualDests, getCap(safePresets.dests, actualDests)) };
        });

        // Remarks: Pass presets AND actuals
        this.createCol(this.rowPrimary, 'remarks', 'col-remarks', () => {
            return { type: 'word', unit: new WordFlap(this.lastDiv, safePresets.remarks, actualRemarks, getCap(safePresets.remarks, actualRemarks)) };
        });

        // Stops: Pass presets AND actuals
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
        const extractFromSchedule = (schedule, key) => {
            if (!schedule) return [];
            return schedule.map(item => {
                if (item[key] && item[key].local) {
                    return item[key];
                }
                return { local: "" };
            });
        };

        const adjustColumnWidth = (cssVar, presetList, scheduleList, minChars = 4) => {
            const fullList = [...(presetList || []), ...(scheduleList || [])];
            if (fullList.length === 0) return;

            let maxLen = 0;
            fullList.forEach(item => {
                const text = item.local || "";
                let visualLength = 0;
                for (let char of text) {
                    // ASCII=0.6，Others=1.0
                    if (char.charCodeAt(0) < 128) visualLength += 0.6;
                    else visualLength += 1;
                }
                if (visualLength > maxLen) maxLen = visualLength;
            });

            if (maxLen < minChars) maxLen = minChars;
            // 30 multiplier (30px font), 20 Padding
            const pixelWidth = Math.ceil((maxLen * 30) + 20);
            document.documentElement.style.setProperty(cssVar, `${pixelWidth}px`);
        };

        const scheduleTypes = extractFromSchedule(scheduleData, 'type');
        adjustColumnWidth('--col-type-width', presetsData.types, scheduleTypes, 4);

        const scheduleDests = extractFromSchedule(scheduleData, 'destination');
        adjustColumnWidth('--col-dest-width', presetsData.dests, scheduleDests, 5);

        // Calculate remarks width
        const presetRemarks = presetsData.remarks || [];
        const scheduleRemarks = extractFromSchedule(scheduleData, 'remarks');
        adjustColumnWidth('--col-rem-width', presetRemarks, scheduleRemarks, 6);

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

        if (leftTitle) leftTitle.textContent = lineName;

        // On initial load, initialize the flipper based on the presets in the JSON
        if (!isInitialized) {
            console.log("[System] Initializing Board...");
            const rowsContainer = document.getElementById('board-rows');
            rowsContainer.innerHTML = "";

            for (let i = 0; i < ROW_COUNT; i++) {
                // Pass scheduleData so we can build the full physical list at start
                groups.push(new TrainGroup(rowsContainer, presetsData, scheduleData));
            }
            isInitialized = true;
        }

        // --- Process timetable data ---
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

        // Update the flipper by semi-iterating through each row
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
