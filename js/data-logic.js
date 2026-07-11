import { makeBlankData, DEFAULT_BLANK_COLOR, DEFAULT_BLANK_TEXT_COLOR } from './config.js';

/**
 * Create Physical List
 * Merges Presets + Actual Schedule Items + Blanks
 * Ensures uniqueness and maintains order (Presets first, then new schedule items)
 */
export function createPhysicalList(presetList, actualList, capacity, blankData) {
	const BLANK = blankData || makeBlankData(DEFAULT_BLANK_COLOR, DEFAULT_BLANK_TEXT_COLOR);
	const seenMains = new Set([BLANK.main]); // Index 0 is always blank
	let list = [{ ...BLANK }];

	// Helper to process and append items
	const processItems = (sourceArray) => {
		if (!Array.isArray(sourceArray)) return;
		sourceArray.forEach(item => {
			// Only add valid items that haven't been added yet
			if (item && item.main && item.main.trim() !== "" && !seenMains.has(item.main)) {
				seenMains.add(item.main);
				list.push({
					main: item.main,
					alt: item.alt,
					color: item.color || BLANK.color,
					textColor: item.textColor || BLANK.textColor
				});
			}
		});
	};

	// 1. Load Presets
	processItems(presetList);

	// 2. Load Actuals
	processItems(actualList);

	// 3. Fill remaining capacity with blank cards
	while (list.length < capacity) {
		list.push({ ...BLANK });
	}

	return list.slice(0, capacity);
}

/**
 * Merge Into Physical List
 * Updates an existing list with new items, using available blank slots
 */
export function mergeIntoPhysicalList(currentList, presetList, actualList, capacity, blankData) {
	const BLANK = blankData || makeBlankData(DEFAULT_BLANK_COLOR, DEFAULT_BLANK_TEXT_COLOR);
	const existingMains = new Set(currentList.map(i => i.main));

	const tryAddItem = (item) => {
		if (item && item.main && item.main.trim() !== "" && !existingMains.has(item.main)) {
			let slotIndex = currentList.findIndex(i => i.main === BLANK.main);

			if (slotIndex !== -1 && slotIndex !== 0) {
				currentList[slotIndex] = {
					main: item.main,
					alt: item.alt,
					color: item.color || BLANK.color,
					textColor: item.textColor || BLANK.textColor
				};
				existingMains.add(item.main);
			} else if (currentList.length < capacity) {
				currentList.push({
					main: item.main,
					alt: item.alt,
					color: item.color || BLANK.color,
					textColor: item.textColor || BLANK.textColor
				});
				existingMains.add(item.main);
			}
		}
	};

	if (presetList) presetList.forEach(tryAddItem);
	if (actualList) actualList.forEach(tryAddItem);

	while (currentList.length < capacity) {
		currentList.push({ ...BLANK });
	}
}
