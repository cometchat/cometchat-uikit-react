import translationAR from "./resources/ar/translation.json";
import translationDE from "./resources/de/translation.json";
import translationEN from "./resources/en/translation.json";
import translationES from "./resources/es/translation.json";
import translationFR from "./resources/fr/translation.json";
import translationHI from "./resources/hi/translation.json";
import translationMS from "./resources/ms/translation.json";
import translationPT from "./resources/pt/translation.json";
import translationRU from "./resources/ru/translation.json";
import translationZH from "./resources/zh/translation.json";
import translationZHTW from "./resources/zh-tw/translation.json";
import translationSV from "./resources/sv/translation.json";
import translationLT from "./resources/lt/translation.json";

/**
 * @example
 * let resources = {
        en: {
            "PARAGRAPH": "Cometchat is a powerful internationalization framework ",
            "CHATS": "Recent Chats",
        },
        es: {
            "PARAGRAPH": "Cometchat es un poderoso marco de internacionalización",
            "CHATS": "chats recientes"
        },
    };
    this.init({
        lang: "es",
        resources: resources
    });
 * 
 */
class CometChatLocalize {
  /**Properties and constants */
  static fallbackLanguage = "en";
  static locale;
  static rtlLanguages = ["ar"];
  static direction = Object.freeze({
    ltr: "ltr",
    rtl: "rtl",
  });
  static translations = {
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
  };

  /**
   * Needs to be called at the start of the application in order to set the language
   * @param {Object} - language & resources
   */
  static init = ({ language, resources }) => {
    if (language) {
      this.locale = language;
    } else {
      this.setDefaultLanguage();
    }

    /**Override resources */
    if (resources) {
      for (const resource in resources) {
        /**Add to the original array of translations if language code is not found */
        if (!this.translations[resource]) {
          this.translations[resource] = resources[resource];
        } else {
          for (const key in resources[resource]) {
            this.translations[resource][key] = resources[resource][key];
          }
        }
      }
    }
  };

  /**
   * Returns the browser language
   * @returns {String} browser langauge i.e. en-US
   */
  static getBrowserLanguage = () => {
    return (
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      navigator.userLanguage
    );
  };

  /**
   * Returns the language code
   * @returns {String} language code i.e. en
   */
  static getLanguageCode = () => {
    const languageCode = this.getBrowserLanguage().toLowerCase();

    // check if the language set in the browser has hyphen(-), if yes split and take the first element of the array
    if (languageCode.indexOf("-") !== -1 && languageCode !== "zh-tw") {
      return languageCode.split("-")[0];
    }

    return languageCode;
  };

  /**
   * Returns the active language. Return fallback language if translation is not available for the active language
   * @returns {String} active language
   */
  static getLocale = () => {
    let language = this.locale;

    if (!this.translations.hasOwnProperty(language)) {
      language = this.fallbackLanguage;
    }
    return language;
  };

  /**
   * Set the active language
   * @param {String} language
   */
  static setLocale = (language) => {
    this.locale = language;
  };

  /**
   * Accepts the string to localize and return the localized string
   * @param {String} str
   * @returns {String} localized str
   */
  static localize(str) {
    let language = this.getLocale();
    return this.translations[language][str];
  }

  /**
   * Sets the default lannguage if no language is passed in init method
   */
  static setDefaultLanguage = () => {
    // get the active language
    const activeLanguage = this.getLocale();
    // get the browser language code
    let browserLanguageCode = this.getLanguageCode();

    // if there is no active language or active language is different from browser language, update active language with browser language
    if (!activeLanguage || activeLanguage !== browserLanguageCode) {
      this.setLocale(browserLanguageCode);
    }
  };

  /**
   * Returns true if the active language is rtl otherwise return false
   * @returns {Boolean} whether the language is rtl or not
   */
  static isRTL = () => {
    if (this.rtlLanguages?.includes(this.getLocale())) {
      return true;
    }

    return false;
  };

  /**
   * Returns rtl or ltr based on the active language
   * @returns {String} the direction of the active langauge
   */
  static getDir = () => {
    if (this.rtlLanguages?.includes(this.getLocale())) {
      return this.direction.rtl;
    }

    return this.direction.ltr;
  };
}

/**
 * Returns localized string based on active language
 * @param {String} str
 * @returns {String} localized str
 */
const localize = (str) => CometChatLocalize.localize(str);

export { CometChatLocalize, localize };