import * as enums from "../../util/enums.js";

import translationAR from "./locales/ar/translation.json";
import translationDE from "./locales/de/translation.json";
import translationEN from "./locales/en/translation.json";
import translationENGB from "./locales/en-gb/translation.json";
import translationENUS from "./locales/en-us/translation.json";
import translationES from "./locales/es/translation.json";
import translationFR from "./locales/fr/translation.json";
import translationHI from "./locales/hi/translation.json";
import translationMS from "./locales/ms/translation.json";
import translationPT from "./locales/pt/translation.json";
import translationRU from "./locales/ru/translation.json";
import translationZH from "./locales/zh/translation.json";
import translationZHTW from "./locales/zh-tw/translation.json";

// the translations
const translations = {
    "ar": translationAR,
    "de": translationDE,
    "en": translationEN,
    "en-gb": translationENGB,
    "en-us": translationENUS,
    "es": translationES,
    "fr": translationFR,
    "hi": translationHI,
    "ms": translationMS,
    "pt": translationPT,
    "ru": translationRU,
    "zh": translationZH,
    "zh-tw": translationZHTW
};

window.addEventListener('languagechange', () => {
    let language = Translator.getBrowserLanguage().toLowerCase();
    Translator.setLanguage(language);
});

class Translator {

    static key = enums["LOCALE_KEY"];
    static rtlLanguages = ["ar"];

    static getLanguage = () => {

        return localStorage.getItem(this.key);
    }

    static setLanguage = (language) => {

        const item = this.key;
        localStorage.setItem(item, language);
    }

    static getBrowserLanguage = () => ((navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage);

    static getDefaultLanguage = () => {

        let language = this.getLanguage();
        if (language) {

            return language;

        } else {

            let language = this.getBrowserLanguage().toLowerCase();
            this.setLanguage(language);
            
            return language;
        }
    }

    static getDirection(language) {
        return this.rtlLanguages.includes(language) ? "rtl" : "ltr";
    }

    static translate(str, language) {

        const languageDb = translations[language];
        if (languageDb) {

            if (languageDb.hasOwnProperty(str)) {
                return languageDb[str];
            }

            return str;

        } else {

            console.log("Error while translating::defaulting to en");
            const languageDb = translations["en"];
            if (languageDb.hasOwnProperty(str)) {
                return languageDb[str];
            }

            return str;
        }
    }
}

export default Translator;