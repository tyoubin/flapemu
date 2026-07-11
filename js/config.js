export const DEFAULT_BLANK_COLOR = "#202020";
export const DEFAULT_BLANK_TEXT_COLOR = "#f5f5f5";

export function makeBlankData(blankColor, blankTextColor) {
	return {
		main: " ",
		alt: " ",
		color: blankColor || DEFAULT_BLANK_COLOR,
		textColor: blankTextColor || DEFAULT_BLANK_TEXT_COLOR
	};
}

export const FLAP_ANIMATION_FALLBACK_MS = 1000;
export const LAYOUT_WIDTH_MULTIPLIER = 32;
export const LAYOUT_WIDTH_PADDING = 20;

export const WORD_CAPACITY_CONFIG = {
	blankCards: 15,
	min: 40,
	max: 80
};