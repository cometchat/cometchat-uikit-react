import translationDE from "./resources/de/translation.json";
import translationENUS from "./resources/en-us/translation.json";
import translationENGB from "./resources/en-gb/translation.json";
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
import translationHU from "./resources/hu/translation.json";
import translationTR from "./resources/tr/translation.json";
import translationNL from "./resources/nl/translation.json";
import translationIT from "./resources/it/translation.json";
import translationJA from "./resources/ja/translation.json";
import translationKO from "./resources/ko/translation.json";
import { LocalizationSettings } from "../../utils/Interface";
import { CalendarObject } from "../../utils/CalendarObject";
/**
 * The `CometChatLocalize` class handles localization for the CometChat application.
 * It provides functionality to detect the user's browser language settings and
 * set the application's language accordingly.
 */
class CometChatLocalize {
    /** Properties and constants */
    static language = "en-US";
    static fallbackLanguage = "en-US";
    static timezone = "America/New_York";
    static translations: { [key: string]: any } = {
    "en-US": translationENUS,
    "en-GB": translationENGB,
    "ru": translationRU,
    "fr": translationFR,
    "de": translationDE,
    "zh": translationZH,
    "zh-TW": translationZHTW,
    "es": translationES,
    "hi": translationHI,
    "ms": translationMS,
    "pt": translationPT,
    "sv": translationSV,
    "lt": translationLT,
    "hu": translationHU,
    "it": translationIT,
    "ja": translationJA,
    "ko": translationKO,
    "nl": translationNL,
    "tr": translationTR,
    };
    static localizationSettings: LocalizationSettings = {};
    static calendarObject: CalendarObject = {};
    static disableAutoDetection = false;
    static disableDateTimeLocalization = false;
    private static defaultTimezones: { [key: string]: string } = {
     "en-US": "America/New_York",
     "en-GB": "Europe/London",
     "ru": "Europe/Moscow",
     "fr": "Europe/Paris",
     "de": "Europe/Berlin",
     "zh": "Asia/Shanghai",
     "zh-TW": "Asia/Taipei",
     "es": "Europe/Madrid",
     "hi": "Asia/Kolkata",
     "ms": "Asia/Kuala_Lumpur",
     "pt": "Europe/Lisbon",
     "sv": "Europe/Stockholm",
     "lt": "Europe/Vilnius",
     "hu": "Europe/Budapest",
     "it": "Europe/Rome",
     "ja": "Asia/Tokyo",
     "ko": "Asia/Seoul",
     "nl": "Europe/Amsterdam",
     "tr": "Europe/Istanbul",
    };

    /**
     * Adds custom translations to the default translations.
     * @param {object} resources - Custom translations object.
     */
     static addTranslation(resources: object) {
        for (const resource in resources) {
            if (!this.translations[resource]) {
                this.translations[resource] = (resources as any)[resource];
            } else {
                Object.assign(this.translations[resource], (resources as any)[resource]);
            }
        }

    }

    /**
     * Returns the browser language.
     * @returns {string} Browser language (e.g., "en-US").
     */
    static getBrowserLanguage() {
        return (navigator.languages && navigator.languages[0]) || navigator.language;
    }

    /**
     * Localizes a given string based on the active language.
     * @param {string} str - String to localize.
     * @returns {string} Localized string.
     */
    static getLocalizedString = (str: string) => {
        let language = this.getCurrentLanguage();
        if (str && this.translations[language][str] && this.translations[language][str] != "") {
            return this.translations[language][str];
        }
        else if(this.localizationSettings.missingKeyHandler){
            this.localizationSettings.missingKeyHandler(str)
        }
        return "";
    }

    private static getDefaultTimeZone() {
        try {
            if (this.disableAutoDetection) {
                return this.defaultTimezones[this.language || "UTC"];
            }
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return this.defaultTimezones[this.language || "UTC"];
        }
    }

    /**
     * Initializes localization settings (v2).
     * @param {LocalizationSettings} settings - Localization settings.
     */
    static init(settings: LocalizationSettings) {
        this.localizationSettings = settings;
        this.disableAutoDetection = settings.disableAutoDetection || false;
        this.disableDateTimeLocalization = settings.disableDateTimeLocalization || false;
        if (!settings.language) {
            this.language = this.getDefaultLanguage()
        }
        else {
            this.language = settings.language;
        }
        this.timezone = settings.timezone || this.getDefaultTimeZone();

        if (settings.calendarObject) {
            this.calendarObject = settings.calendarObject;
        }
        this.fallbackLanguage = settings.fallbackLanguage || this.fallbackLanguage;

        if (settings.translationsForLanguage) {
            this.addTranslation(settings.translationsForLanguage);
        }
    }

    /**
     * Gets the current language.
     * @returns {string} Current language.
     */
    static getCurrentLanguage() {
        return this.translations[this.language] ? this.language : this.fallbackLanguage;
    }

    /**
     * Sets the current language.
     * @param {string} language - Language code to set.
     */
    static setCurrentLanguage(language: string) {
        this.language = language;
        CometChatLocalize.init({ ...this.localizationSettings, ...{ language: language } });
    }
    /**
     * @Returns the current language.
     */
    static getDefaultLanguage() {
        if (this.disableAutoDetection) {
            return this.fallbackLanguage
        }
        return this.getBrowserLanguage();
    }
    /**
     * @Returns the language to localize date.
     */
    static getDateLocaleLanguage() {
        if (this.disableDateTimeLocalization) {
            return "en-US"
        }
        else {
            return this.language
        }
    }

    /**
     * Formats a date using a given pattern.
     * @param {Date} date - Date to format.
     * @param {string} format - Format pattern.
     * @returns {string} Formatted date.
     */
    private static formatDateFromPattern(date: Date, format: string): string {
        const options: Intl.DateTimeFormatOptions = {
            day: format.includes("D") ? "2-digit" : undefined,
            month: format.includes("MMMM") || format.includes("MMM") || format.includes("MM") || format.includes("M") ? "2-digit" : undefined,
            year: format.includes("YYYY") ? "numeric" : format.includes("YY") ? "2-digit" : undefined,
            hour: format.includes("hh") ? "2-digit" : format.includes("h") ? "numeric" : undefined,
            minute: format.includes("mm") ? "2-digit" : format.includes("m") ? "numeric" : undefined,
            hour12: format.includes("A"),
            weekday: format.includes("dddd") ? "long" : format.includes("ddd") || format.includes("dd") ? "short" : undefined,
            timeZone: this.timezone,
        };
         /**
         * Maintaining months and weekday localization for short and long formats.
         */
        const monthNames = {
            short: [
                getLocalizedString("month_january_short"), getLocalizedString("month_february_short"), getLocalizedString("month_march_short"), 
                getLocalizedString("month_april_short"), getLocalizedString("month_may_short"), getLocalizedString("month_june_short"),
                getLocalizedString("month_july_short"), getLocalizedString("month_august_short"), getLocalizedString("month_september_short"),
                getLocalizedString("month_october_short"), getLocalizedString("month_november_short"), getLocalizedString("month_december_short")
            ],
            long: [
                getLocalizedString("month_january_full"), getLocalizedString("month_february_full"), getLocalizedString("month_march_full"), 
                getLocalizedString("month_april_full"), getLocalizedString("month_may_full"), getLocalizedString("month_june_full"),
                getLocalizedString("month_july_full"), getLocalizedString("month_august_full"), getLocalizedString("month_september_full"),
                getLocalizedString("month_october_full"), getLocalizedString("month_november_full"), getLocalizedString("month_december_full")
            ]
        };

        const weekdays = {
            min: [
            getLocalizedString("weekday_sunday_min"), getLocalizedString("weekday_monday_min"), getLocalizedString("weekday_tuesday_min"),
            getLocalizedString("weekday_wednesday_min"), getLocalizedString("weekday_thursday_min"), getLocalizedString("weekday_friday_min"), getLocalizedString("weekday_saturday_min")
            ],
            short: [
            getLocalizedString("weekday_sunday_short"), getLocalizedString("weekday_monday_short"), getLocalizedString("weekday_tuesday_short"),
            getLocalizedString("weekday_wednesday_short"), getLocalizedString("weekday_thursday_short"), getLocalizedString("weekday_friday_short"), getLocalizedString("weekday_saturday_short")
            ],
            long: [
            getLocalizedString("weekday_sunday_full"), getLocalizedString("weekday_monday_full"), getLocalizedString("weekday_tuesday_full"),
            getLocalizedString("weekday_wednesday_full"), getLocalizedString("weekday_thursday_full"), getLocalizedString("weekday_friday_full"), getLocalizedString("weekday_saturday_full")
            ]
        };
        
        const formatter = new Intl.DateTimeFormat(this.getDateLocaleLanguage(), options);
        const parts = formatter.formatToParts(date);
        const dayIndex = date.getDay();

        const replacements: { [key: string]: string } = {};
        parts.forEach((part) => {
            if (part.type === "day") {
                replacements["DD"] = part.value;
                replacements["D"] = parseInt(part.value).toString();
            }
            if (part.type === "month") {
                const monthIndex = parseInt(part.value) - 1;
                replacements["MM"] = part.value;
                replacements["M"] = parseInt(part.value).toString();
                replacements["MMM"] = monthNames.short[monthIndex];
                replacements["MMMM"] = monthNames.long[monthIndex];
            }
            if (part.type === "year") {
                replacements["YYYY"] = part.value;
                replacements["YY"] = part.value.slice(-2);
            }
            if (part.type === "hour") {
                replacements["hh"] = part.value;
                replacements["h"] = parseInt(part.value).toString();
            }
            if (part.type === "minute") {
                replacements["mm"] = part.value;
                replacements["m"] = parseInt(part.value).toString();
            }
            if (part.type === "dayPeriod") {
                replacements["A"] = part.value;
            }
            if (part.type === "weekday") {
                replacements["dddd"] = weekdays.long[dayIndex] || "";
                replacements["ddd"] = weekdays.short[dayIndex] || "";
                replacements["dd"] = weekdays.min[dayIndex] || "";
            }
        });

        return format
        .replace(/\[(.*?)\]/g, "$1")
        .replace(/\bDD\b/g, replacements["DD"] || "")
        .replace(/\bD\b/g, replacements["D"] || "")
        .replace(/\bMMMM\b/g, replacements["MMMM"] || "")
        .replace(/\bMMM\b/g, replacements["MMM"] || "")
        .replace(/\bMM\b/g, replacements["MM"] || "")
        .replace(/\bM\b/g, replacements["M"] || "")
        .replace(/\bYYYY\b/g, replacements["YYYY"] || "")
        .replace(/\bYY\b/g, replacements["YY"] || "")
        .replace(/\bhh\b/g, replacements["hh"] || "")
        .replace(/\bh\b/g, replacements["h"] || "")
        .replace(/\bmm\b/g, replacements["mm"] || "")
        .replace(/\bm\b/g, replacements["m"] || "")
        .replace(/\bdddd\b/g, replacements["dddd"] || "")
        .replace(/\bddd\b/g, replacements["ddd"] || "")
        .replace(/\bdd\b/g, replacements["dd"] || "")
        .replace(/\sA\s/g, ` ${replacements["A"] || "A"} `)
        .replace(/^A\s/g, `${replacements["A"] || "A"} `)
        .replace(/\sA$/, ` ${replacements["A"] || "A"}`)
        .replace(/^A$/, `${replacements["A"] || "A"}`);
    

    }



    /**
     * Formats a timestamp based on the provided calendar configuration.
     * @param {number} timestamp - Timestamp to format.
     * @param {CalendarObject} calendarObject - Calendar configuration.
     * @returns {string} Formatted date string.
     */
    static formatDate(timestamp: number, calendarObject: CalendarObject): string {
        const timeZone = CometChatLocalize.timezone;
        const now = new Date();
        const date = new Date(timestamp * 1000);
        const nowFormatted = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
        const dateFormatted = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
        const nowTime = now.getTime();
        const dateTime = date.getTime();
        const diffInSeconds = Math.floor((nowTime - dateTime) / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        if (calendarObject.relativeTime && Object.keys(calendarObject.relativeTime).length > 0) {
            if (diffInSeconds < 60) {
                if (calendarObject?.relativeTime?.minute) {
                    return calendarObject?.relativeTime?.minute.includes("%d")
                        ? `${calendarObject?.relativeTime?.minute.replace("%d", "1")}`
                        : calendarObject?.relativeTime?.minute;
                } else if (calendarObject.today) {
                    return this.formatDateFromPattern(date, calendarObject.today);
                }
            }
            if (diffInMinutes < 60) {
                if (calendarObject?.relativeTime?.minutes) {
                    return calendarObject?.relativeTime?.minutes.includes("%d")
                        ? `${calendarObject?.relativeTime?.minutes.replace("%d", String(diffInMinutes))}`
                        : calendarObject?.relativeTime?.minutes;
                } else if (calendarObject.today) {
                    return this.formatDateFromPattern(date, calendarObject.today);
                }
            }
            if (diffInHours < 24) {
                if (calendarObject.relativeTime?.hour && diffInHours === 1) {
                    return calendarObject.relativeTime.hour.replace("%d", "1");
                }
                if (calendarObject.relativeTime?.hours) {
                    return calendarObject.relativeTime.hours.replace("%d", String(diffInHours));
                }
            }

        }
        if (nowFormatted === dateFormatted && calendarObject.today) {
            return this.formatDateFromPattern(date, calendarObject.today);
        } else if (this.isYesterday(timestamp, timeZone) && calendarObject.yesterday) {
            return this.formatDateFromPattern(date, calendarObject.yesterday);
        } else if (diffInDays <= 7 && calendarObject.lastWeek) {
            return this.formatDateFromPattern(date, calendarObject.lastWeek);
        } else {
            return this.formatDateFromPattern(date, calendarObject.otherDays || "DD MMM, YYYY");
        }
    }

    private static isYesterday(timestamp: number, timeZone: string): boolean {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const timestampDate = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp * 1000));
        const yesterdayDate = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(yesterday);
        return timestampDate === yesterdayDate;
    }

}

const getLocalizedString = (str: string) => CometChatLocalize.getLocalizedString(str);
export { CometChatLocalize, getLocalizedString };
