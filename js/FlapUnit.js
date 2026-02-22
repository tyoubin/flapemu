import { BLANK_DATA, FLAP_ANIMATION_FALLBACK_MS } from './config.js';
import { createPhysicalList, mergeIntoPhysicalList } from './data-logic.js';

export class FlapUnit {
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
		this.backFlap = this.element.querySelector('.flap.back');
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
			const targetLocal = (val && val.local) ? val.local : BLANK_DATA.local;

			if (targetLocal === BLANK_DATA.local || targetLocal === "") {
				nextIndex = 0;
			} else {
				nextIndex = this.physicalList.findIndex(item => item.local === targetLocal);
				if (nextIndex === -1) {
					console.warn(`[FlapUnit] Target '${targetLocal}' not found in physical list. Defaulting to blank.`);
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
	constructor(parent, presetList, actualList, capacity) {
		super(parent, 'flap-word', 'word');
		this.physicalList = createPhysicalList(presetList, actualList, capacity);
		this.renderTo(this.topContent, this.physicalList[0]);
		this.renderTo(this.bottomContent, this.physicalList[0]);
	}

	updateList(presetList, actualList, capacity) {
		mergeIntoPhysicalList(this.physicalList, presetList, actualList, capacity);
	}
}
