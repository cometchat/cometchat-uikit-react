class Typography {
	fontFamily = ["Inter,sans-serif"].join(",");
	fontWeightRegular = "400";
	fontWeightMedium = "500";
	fontWeightSemibold = "600";
	fontWeightBold = "700";

	heading = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightBold,
		fontSize: "22px",
	};

	name = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "16px",
	};

	title1 = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightRegular,
		fontSize: "22px",
	};

	title2 = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightSemibold,
		fontSize: "15px",
	};

	subtitle1 = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightRegular,
		fontSize: "15px",
	};

	subtitle2 = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightRegular,
		fontSize: "13px",
	};

	text1 = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "15px",
	};

	text2 = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "13px",
	};

	caption1 = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "12px",
	};

	caption2 = {
		fontFamily: this.fontFamily,
		fontWeight: this.fontWeightMedium,
		fontSize: "11px",
	};

	setFontFamily(fontFamily) {
		this.fontFamily = fontFamily.join(",");
	}

	setFontWeightRegular(fontWeightRegular) {
		this.fontWeightRegular = fontWeightRegular;
	}

	setFontWeightMedium(fontWeightMedium) {
		this.fontWeightMedium = fontWeightMedium;
	}

	setFontWeightSemibold(fontWeightSemibold) {
		this.fontWeightSemibold = fontWeightSemibold;
	}

	setFontWeightBold(fontWeightBold) {
		this.fontWeightBold = fontWeightBold;
	}

	setHeading(headingFont) {

		if (headingFont && headingFont.fontSize) {
			this.heading.fontSize = headingFont.fontSize;
		}

		if (headingFont && headingFont.fontWeight) {
			this.heading.fontWeight = headingFont.fontWeight;
		}
	}

	setName(nameFont) {

		if (nameFont && nameFont.fontSize) {
			this.name.fontSize = nameFont.fontSize;
		}

		if (nameFont && nameFont.fontWeight) {
			this.name.fontWeight = nameFont.fontWeight;
		}
	}

	setTitle1(titleFont) {

		if (titleFont && titleFont.fontSize) {
			this.title1.fontSize = titleFont.fontSize;
		}

		if (titleFont && titleFont.fontWeight) {
			this.title1.fontWeight = titleFont.fontWeight;
		}
	}

	setTitle2(titleFont) {

		if (titleFont && titleFont.fontSize) {
			this.title2.fontSize = titleFont.fontSize;
		}

		if (titleFont && titleFont.fontWeight) {
			this.title2.fontWeight = titleFont.fontWeight;
		}
	}

	setSubtitle1(subtitleFont) {

		if (subtitleFont && subtitleFont.fontSize) {
			this.subtitle1.fontSize = subtitleFont.fontSize;
		}

		if (subtitleFont && subtitleFont.fontWeight) {
			this.subtitle1.fontWeight = subtitleFont.fontWeight;
		}
	}

	setSubtitle2(subtitleFont) {

		if (subtitleFont && subtitleFont.fontSize) {
			this.subtitle2.fontSize = subtitleFont.fontSize;
		}

		if (subtitleFont && subtitleFont.fontWeight) {
			this.subtitle2.fontWeight = subtitleFont.fontWeight;
		}
	}

	setText1(textFont) {

		if (textFont && textFont.fontSize) {
			this.text1.fontSize = textFont.fontSize;
		}

		if (textFont && textFont.fontWeight) {
			this.text1.fontWeight = textFont.fontWeight;
		}
	}

	setText2(textFont) {

		if (textFont && textFont.fontSize) {
			this.text2.fontSize = textFont.fontSize;
		}

		if (textFont && textFont.fontWeight) {
			this.text2.fontWeight = textFont.fontWeight;
		}
	}

	setCaption1(captionFont) {

		if (captionFont && captionFont.fontSize) {
			this.caption1.fontSize = captionFont.fontSize;
		}

		if (captionFont && captionFont.fontWeight) {
			this.caption1.fontWeight = captionFont.fontWeight;
		}
	}

	setCaption2(captionFont) {

		if (captionFont && captionFont.fontSize) {
			this.caption2.fontSize = captionFont.fontSize;
		}

		if (captionFont && captionFont.fontWeight) {
			this.caption2.fontWeight = captionFont.fontWeight;
		}
	}
}

export { Typography };
