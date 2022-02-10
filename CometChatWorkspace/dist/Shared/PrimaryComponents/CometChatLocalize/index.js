"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.localize = exports.CometChatLocalize = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _translation = _interopRequireDefault(require("./resources/ar/translation.json"));

var _translation2 = _interopRequireDefault(require("./resources/de/translation.json"));

var _translation3 = _interopRequireDefault(require("./resources/en/translation.json"));

var _translation4 = _interopRequireDefault(require("./resources/es/translation.json"));

var _translation5 = _interopRequireDefault(require("./resources/fr/translation.json"));

var _translation6 = _interopRequireDefault(require("./resources/hi/translation.json"));

var _translation7 = _interopRequireDefault(require("./resources/ms/translation.json"));

var _translation8 = _interopRequireDefault(require("./resources/pt/translation.json"));

var _translation9 = _interopRequireDefault(require("./resources/ru/translation.json"));

var _translation10 = _interopRequireDefault(require("./resources/zh/translation.json"));

var _translation11 = _interopRequireDefault(require("./resources/zh-tw/translation.json"));

var _translation12 = _interopRequireDefault(require("./resources/sv/translation.json"));

var _translation13 = _interopRequireDefault(require("./resources/lt/translation.json"));

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
var CometChatLocalize = /*#__PURE__*/function () {
  function CometChatLocalize() {
    (0, _classCallCheck2.default)(this, CometChatLocalize);
  }

  (0, _createClass2.default)(CometChatLocalize, null, [{
    key: "localize",
    value:
    /**Properties and constants */

    /**
     * Needs to be called at the start of the application in order to set the language
     * @param {Object} - language & resources
     */

    /**
     * Returns the browser language
     * @returns {String} browser langauge i.e. en-US
     */

    /**
     * Returns the language code
     * @returns {String} language code i.e. en
     */

    /**
     * Returns the active language. Return fallback language if translation is not available for the active language
     * @returns {String} active language
     */

    /**
     * Set the active language
     * @param {String} language
     */

    /**
     * Accepts the string to localize and return the localized string
     * @param {String} str
     * @returns {String} localized str
     */
    function localize(str) {
      var language = this.getLocale();
      return this.translations[language][str];
    }
    /**
     * Sets the default lannguage if no language is passed in init method
     */

  }]);
  return CometChatLocalize;
}();
/**
 * Returns localized string based on active language
 * @param {String} str
 * @returns {String} localized str
 */


exports.CometChatLocalize = CometChatLocalize;
(0, _defineProperty2.default)(CometChatLocalize, "fallbackLanguage", "en");
(0, _defineProperty2.default)(CometChatLocalize, "locale", void 0);
(0, _defineProperty2.default)(CometChatLocalize, "rtlLanguages", ["ar"]);
(0, _defineProperty2.default)(CometChatLocalize, "direction", Object.freeze({
  ltr: "ltr",
  rtl: "rtl"
}));
(0, _defineProperty2.default)(CometChatLocalize, "translations", {
  ar: _translation.default,
  de: _translation2.default,
  en: _translation3.default,
  es: _translation4.default,
  fr: _translation5.default,
  hi: _translation6.default,
  ms: _translation7.default,
  pt: _translation8.default,
  ru: _translation9.default,
  zh: _translation10.default,
  "zh-tw": _translation11.default,
  sv: _translation12.default,
  lt: _translation13.default
});
(0, _defineProperty2.default)(CometChatLocalize, "init", function (_ref) {
  var language = _ref.language,
      resources = _ref.resources;

  if (language) {
    CometChatLocalize.locale = language;
  } else {
    CometChatLocalize.setDefaultLanguage();
  }
  /**Override resources */


  if (resources) {
    for (var resource in resources) {
      /**Add to the original array of translations if language code is not found */
      if (!CometChatLocalize.translations[resource]) {
        CometChatLocalize.translations[resource] = resources[resource];
      } else {
        for (var key in resources[resource]) {
          CometChatLocalize.translations[resource][key] = resources[resource][key];
        }
      }
    }
  }
});
(0, _defineProperty2.default)(CometChatLocalize, "getBrowserLanguage", function () {
  return navigator.languages && navigator.languages[0] || navigator.language || navigator.userLanguage;
});
(0, _defineProperty2.default)(CometChatLocalize, "getLanguageCode", function () {
  var languageCode = CometChatLocalize.getBrowserLanguage().toLowerCase(); // check if the language set in the browser has hyphen(-), if yes split and take the first element of the array

  if (languageCode.indexOf("-") !== -1 && languageCode !== "zh-tw") {
    return languageCode.split("-")[0];
  }

  return languageCode;
});
(0, _defineProperty2.default)(CometChatLocalize, "getLocale", function () {
  var language = CometChatLocalize.locale;

  if (!CometChatLocalize.translations.hasOwnProperty(language)) {
    language = CometChatLocalize.fallbackLanguage;
  }

  return language;
});
(0, _defineProperty2.default)(CometChatLocalize, "setLocale", function (language) {
  CometChatLocalize.locale = language;
});
(0, _defineProperty2.default)(CometChatLocalize, "setDefaultLanguage", function () {
  // get the active language
  var activeLanguage = CometChatLocalize.getLocale(); // get the browser language code

  var browserLanguageCode = CometChatLocalize.getLanguageCode(); // if there is no active language or active language is different from browser language, update active language with browser language

  if (!activeLanguage || activeLanguage !== browserLanguageCode) {
    CometChatLocalize.setLocale(browserLanguageCode);
  }
});
(0, _defineProperty2.default)(CometChatLocalize, "isRTL", function () {
  if (CometChatLocalize.rtlLanguages.includes(CometChatLocalize.getLocale())) {
    return true;
  }

  return false;
});
(0, _defineProperty2.default)(CometChatLocalize, "getDir", function () {
  if (CometChatLocalize.rtlLanguages.includes(CometChatLocalize.getLocale())) {
    return CometChatLocalize.direction.rtl;
  }

  return CometChatLocalize.direction.ltr;
});

var localize = function localize(str) {
  return CometChatLocalize.localize(str);
};

exports.localize = localize;