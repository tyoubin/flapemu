import { BLANK_DATA } from './config.js';

/**
 * Create Physical List
 * Merges Presets + Actual Schedule Items + Blanks
 * Ensures uniqueness and maintains order (Presets first, then new schedule items)
 */
export function createPhysicalList(presetList, actualList, capacity) {
	const seenLocals = new Set([BLANK_DATA.local]); // Index 0 is always blank
	let list = [{ ...BLANK_DATA }];

	// Helper to process and append items
	const processItems = (sourceArray) => {
		if (!Array.isArray(sourceArray)) return;
		sourceArray.forEach(item => {
			// Only add valid items that haven't been added yet
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

	// 1. Load Presets
	processItems(presetList);

	// 2. Load Actuals
	processItems(actualList);

	// 3. Fill remaining capacity with BLANK cards
	while (list.length < capacity) {
		list.push({ ...BLANK_DATA });
	}

	return list.slice(0, capacity);
}

/**
 * Merge Into Physical List
 * Updates an existing list with new items, using available blank slots
 */
export function mergeIntoPhysicalList(currentList, presetList, actualList, capacity) {
	const existingLocals = new Set(currentList.map(i => i.local));

	const tryAddItem = (item) => {
		if (item && item.local && item.local.trim() !== "" && !existingLocals.has(item.local)) {
			let slotIndex = currentList.findIndex(i => i.local === BLANK_DATA.local);

			if (slotIndex !== -1 && slotIndex !== 0) {
				currentList[slotIndex] = {
					local: item.local,
					en: item.en,
					color: item.color || "#202020",
					textColor: item.textColor || "#f5f5f5"
				};
				existingLocals.add(item.local);
			} else if (currentList.length < capacity) {
				currentList.push({
					local: item.local,
					en: item.en,
					color: item.color || "#202020",
					textColor: item.textColor || "#f5f5f5"
				});
				existingLocals.add(item.local);
			}
		}
	};

	if (presetList) presetList.forEach(tryAddItem);
	if (actualList) actualList.forEach(tryAddItem);

	while (currentList.length < capacity) {
		currentList.push({ ...BLANK_DATA });
	}
}
