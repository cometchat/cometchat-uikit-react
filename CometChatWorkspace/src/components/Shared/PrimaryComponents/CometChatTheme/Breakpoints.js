class Breakpoints {
	values = {
		xs: 0,
		sm: 600,
		md: 900,
		lg: 1200,
		xl: 1536,
	};

	setValues (values) {
		this.values = values;
	}

	up(key) {
		return `@media (min-width:${this.values[key] - 0.5}px)`;
	}

	down(key) {
		return `@media (max-width:${this.values[key] - 0.5}px)`;
	}

	between(keyA, keyB) {
		return `@media (min-width:${this.values[keyA]}px) and (max-width:${this.values[keyB] - 0.5}px)`;
	}
}

export { Breakpoints };