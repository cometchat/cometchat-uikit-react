/**
 * @class FontDetails
 * @param {String} fontFamily
 * @param {String} fontWeight
 * @param {String} fontSize
 */
class FontDetails {
	constructor({
		fontFamily = "",
		fontWeight = "",
		fontSize = ""
	}) {
		this.fontFamily = fontFamily;
		this.fontWeight = fontWeight;
		this.fontSize = fontSize;
	}
}



/**
 * @class Typography
 * @param {String} fontFamily
 * @param {String} fontWeightRegular
 * @param {String} fontWeightMedium
 * @param {String} fontWeightSemibold
 * @param {String} fontWeightBold
 * @param {Object} heading
 * @param {Object} name
 * @param {Object} title1
 * @param {Object} title2
 * @param {Object} subtitle1
 * @param {Object} subtitle2
 * @param {Object} text1
 * @param {Object} text2
 * @param {Object} caption1
 * @param {Object} caption2
 */
class Typography {

	constructor({
		fontFamily = ["Inter,sans-serif"].join(","),
		fontWeightRegular = "400",
		fontWeightMedium = "500",
		fontWeightSemibold = "600",
		fontWeightBold = "700",

		heading = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightBold,
			fontSize: "22px",
		}),

		name = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightMedium,
			fontSize: "16px",
		}),

		title1 = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightRegular,
			fontSize: "22px",
		}),

		title2 = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightSemibold,
			fontSize: "15px",
		}),

		subtitle1 = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightRegular,
			fontSize: "15px",
		}),

		subtitle2 = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightRegular,
			fontSize: "13px",
		}),

		text1 = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightMedium,
			fontSize: "15px",
		}),

		text2 = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightMedium,
			fontSize: "13px",
		}),

		caption1 = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightMedium,
			fontSize: "12px",
		}),

		caption2 = new FontDetails({
			fontFamily: fontFamily,
			fontWeight: fontWeightMedium,
			fontSize: "11px",
		}),
	}) {
		this.fontFamily = fontFamily;
		this.fontWeightRegular = fontWeightRegular;
		this.fontWeightMedium = fontWeightMedium;
		this.fontWeightSemibold = fontWeightSemibold;
		this.fontWeightBold = fontWeightBold;
		this.heading = new FontDetails(heading);
		this.name = new FontDetails(name);
		this.title1 = new FontDetails(title1);
		this.title2 = new FontDetails(title2);
		this.subtitle1 = new FontDetails(subtitle1);
		this.subtitle2 = new FontDetails(subtitle2);
		this.text1 = new FontDetails(text1);
		this.text2 = new FontDetails(text2);
		this.caption1 = new FontDetails(caption1);
		this.caption2 = new FontDetails(caption2);
	}

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