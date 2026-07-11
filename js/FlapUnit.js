import { FLAP_ANIMATION_FALLBACK_MS } from './config.js';
import { createPhysicalList, mergeIntoPhysicalList } from './data-logic.js';

const BLANK_MAIN = " ";

export class FlapUnit {
	constructor(parentElement, cssClass, type) {
		this.element = document.createElement('div');
		this.element.className = `flap-unit ${cssClass}`;
		this.type = type;
		this.pointer = 0;
		this.targetPointer = 0;
		this.isAnimating = false;
		this.physicalList = [];
		this.wordIndexMap = null;

		this.element.innerHTML = `
            <div class="top"><div class="card-content"></div></div><div class="bottom"><div class="card-content"></div></div>
            <div class="flap front"><div class="card-content"></div></div><div class="flap back"><div class="card-content"></div></div>
        `;
		this.topContent = this.element.querySelector('.top .card-content');
		this.bottomContent = this.element.querySelector('.bottom .card-content');
		this.frontContent = this.element.querySelector('.flap.front .card-content');
		this.backContent = this.element.querySelector('.flap.back .card-content');
		this.backFlap = this.element.querySelector('.flap.back');
		parentElement.appendChild(this.element);
	}

	blankCardColor() {
		return (this.blankData && this.blankData.color) || "#202020";
	}

	renderTo(container, data) {
		container.innerHTML = '';

		const blankColor = this.blankCardColor();
		if (data.color && data.color !== blankColor) {
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
			const mainDiv = document.createElement('div');
			mainDiv.className = 'main-text';
			mainDiv.textContent = data.main;

			const altDiv = document.createElement('div');
			altDiv.className = 'alt-text';
			altDiv.textContent = data.alt;

			if (data.textColor) {
				altDiv.style.color = data.textColor;
				if (data.textColor === "#000000") altDiv.style.opacity = "0.7";
			}

			container.appendChild(mainDiv);
			container.appendChild(altDiv);
		}
	}

	rebuildWordIndexMap() {
		if (this.type !== 'word') return;

		this.wordIndexMap = new Map();
		this.physicalList.forEach((item, idx) => {
			const main = (item && item.main) ? item.main : BLANK_MAIN;
			if (!this.wordIndexMap.has(main)) {
				this.wordIndexMap.set(main, idx);
			}
		});
	}

	setTarget(val) {
		let nextIndex = 0;

		if (this.type === 'char') {
			val = val.toString();
			nextIndex = this.physicalList.indexOf(val);
			if (nextIndex === -1) nextIndex = 0;
		} else {
			const targetMain = (val && val.main) ? val.main : BLANK_MAIN;

			if (targetMain === BLANK_MAIN || targetMain === "") {
				nextIndex = 0;
			} else {
				if (this.wordIndexMap && this.wordIndexMap.has(targetMain)) {
					nextIndex = this.wordIndexMap.get(targetMain);
				} else {
					nextIndex = this.physicalList.findIndex(item => item.main === targetMain);
				}
				if (nextIndex === -1) {
					console.warn(`[FlapUnit] Target '${targetMain}' not found in physical list. Defaulting to blank.`);
					nextIndex = 0;
				}
			}
		}

		this.targetPointer = nextIndex;
		if (this.pointer !== this.targetPointer && !this.isAnimating) {
			this.step();
		}
	}

	step() {
		if (this.pointer === this.targetPointer) {
			this.isAnimating = false;
			return;
		}

		let currentData = this.physicalList[this.pointer];
		this.pointer = (this.pointer + 1) % this.physicalList.length;
		let nextData = this.physicalList[this.pointer];

		this.element.classList.remove('flipping');
		void this.element.offsetWidth;

		this.isAnimating = true;

		this.renderTo(this.topContent, nextData);
		this.renderTo(this.bottomContent, currentData);
		this.renderTo(this.frontContent, currentData);
		this.renderTo(this.backContent, nextData);

		this.element.classList.add('flipping');

		let finished = false;

		const onAnimationFinish = (e) => {
			if (finished) return;
			if (e && e.animationName && e.animationName !== 'flip-down-back') return;

			finished = true;
			if (this.backFlap) this.backFlap.removeEventListener('animationend', onAnimationFinish);
			clearTimeout(fallbackTimeout);

			this.element.classList.remove('flipping');
			this.renderTo(this.frontContent, nextData);
			this.renderTo(this.bottomContent, nextData);

			if (this.pointer !== this.targetPointer) {
				requestAnimationFrame(() => this.step());
			} else {
				this.isAnimating = false;
			}
		};

		if (this.backFlap) {
			this.backFlap.addEventListener('animationend', onAnimationFinish);
		} else {
			onAnimationFinish();
			return;
		}

		const fallbackTimeout = setTimeout(onAnimationFinish, FLAP_ANIMATION_FALLBACK_MS);
	}
}

export class CharFlap extends FlapUnit {
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

export class WordFlap extends FlapUnit {
	constructor(parent, presetList, actualList, capacity, blankData, textAlign) {
		super(parent, 'flap-word', 'word');
		this.blankData = blankData;
		this.textAlign = textAlign || 'center';
		this.physicalList = createPhysicalList(presetList, actualList, capacity, blankData);
		this.rebuildWordIndexMap();
		this.renderTo(this.topContent, this.physicalList[0]);
		this.renderTo(this.bottomContent, this.physicalList[0]);
	}

	updateList(presetList, actualList, capacity) {
		mergeIntoPhysicalList(this.physicalList, presetList, actualList, capacity, this.blankData);
		this.rebuildWordIndexMap();
	}

	renderTo(container, data) {
		super.renderTo(container, data);
		if (this.type === 'word' && this.textAlign === 'left') {
			const items = container.querySelectorAll('.main-text, .alt-text');
			items.forEach(el => {
				el.style.justifyContent = 'flex-start';
				el.style.paddingLeft = '15px';
			});
		}
	}
}
