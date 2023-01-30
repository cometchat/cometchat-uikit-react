import * as enums from "../../util/enums.js";

import translationAR from "./locales/ar/translation.json";
import translationDE from "./locales/de/translation.json";
import translationEN from "./locales/en/translation.json";
import translationES from "./locales/es/translation.json";
import translationFR from "./locales/fr/translation.json";
import translationHI from "./locales/hi/translation.json";
import translationMS from "./locales/ms/translation.json";
import translationPT from "./locales/pt/translation.json";
import translationRU from "./locales/ru/translation.json";
import translationZH from "./locales/zh/translation.json";
import translationZHTW from "./locales/zh-tw/translation.json";
import translationSV from "./locales/sv/translation.json";
import translationLT from "./locales/lt/translation.json";
import translationHU from "./locales/hu/translation.json";

// the translations
const translations = {
	ar: translationAR,
	de: translationDE,
	en: translationEN,
	es: translationES,
	fr: translationFR,
	hi: translationHI,
	ms: translationMS,
	pt: translationPT,
	ru: translationRU,
	zh: translationZH,
	"zh-tw": translationZHTW,
	sv: translationSV,
	lt: translationLT,
	hu: translationHU,
};

class Translator {
	static key = enums.CONSTANTS["LOCALE"];
	static rtlLanguages = ["ar"];
	static defaultLanguage = "en";

	static getLanguage = () => {
		return localStorage.getItem(this.key);
	};

	static setLanguage = (language) => {
		const item = this.key;
		localStorage.setItem(item, language);
	};

	static getBrowserLanguage = () =>
		(navigator.languages && navigator.languages[0]) ||
		navigator.language ||
		navigator.userLanguage;

	static getDefaultLanguage = () => {
		//get the language from localstorage
		const savedLanguage = this.getLanguage();

		//get the language set in the browser
		const browserLanguageCode = Translator.getBrowserLanguage().toLowerCase();
		let browserLanguage = browserLanguageCode;

		//check if the language set in the browser has hyphen(-), if yes split and take the first element of the array
		if (
			browserLanguageCode !== "zh-tw" &&
			browserLanguageCode.indexOf("-") !== -1
		) {
			const browserLanguageArray = browserLanguageCode.split("-");
			browserLanguage = browserLanguageArray[0];
		}

		//if there is language set in localstorage and it is different from browser language, update local storage and return the language code
		if (savedLanguage) {
			if (savedLanguage !== browserLanguage) {
				this.setLanguage(browserLanguage);

				//if the translations are not available, default to en
				return translations.hasOwnProperty(browserLanguage)
					? browserLanguage
					: this.defaultLanguage;
			} else {
				//if the translations are not available, default to en
				return translations.hasOwnProperty(browserLanguage)
					? browserLanguage
					: this.defaultLanguage;
			}
		} else {
			this.setLanguage(browserLanguage);

			//if the translations are not available, default to en
			return translations.hasOwnProperty(browserLanguage)
				? browserLanguage
				: this.defaultLanguage;
		}
	};

	static getDirection(language) {
		return this.rtlLanguages.includes(language) ? "rtl" : "ltr";
	}

	static translate(str, language) {
		if (translations.hasOwnProperty(language)) {
			const languageDb = translations[language];
			if (languageDb.hasOwnProperty(str)) {
				return languageDb[str];
			}

			return str;
		} else {
			const languageDb = translations[this.defaultLanguage];
			if (languageDb.hasOwnProperty(str)) {
				return languageDb[str];
			}

			return str;
		}
	}
}

export default Translator;
