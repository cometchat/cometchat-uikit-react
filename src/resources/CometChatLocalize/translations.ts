/**
 * Barrel re-export of all translation JSON files.
 */
import enUs from './resources/en-us/translation.json';
import enGb from './resources/en-gb/translation.json';
import de from './resources/de/translation.json';
import es from './resources/es/translation.json';
import fr from './resources/fr/translation.json';
import hi from './resources/hi/translation.json';
import hu from './resources/hu/translation.json';
import it from './resources/it/translation.json';
import ja from './resources/ja/translation.json';
import ko from './resources/ko/translation.json';
import lt from './resources/lt/translation.json';
import ms from './resources/ms/translation.json';
import nl from './resources/nl/translation.json';
import pt from './resources/pt/translation.json';
import ru from './resources/ru/translation.json';
import sv from './resources/sv/translation.json';
import tr from './resources/tr/translation.json';
import zh from './resources/zh/translation.json';
import zhTw from './resources/zh-tw/translation.json';

export const translationResources: Record<string, Record<string, Record<string, string>>> = {
  'en-us': { translation: enUs },
  'en-gb': { translation: enGb },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
  hi: { translation: hi },
  hu: { translation: hu },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  lt: { translation: lt },
  ms: { translation: ms },
  nl: { translation: nl },
  pt: { translation: pt },
  ru: { translation: ru },
  sv: { translation: sv },
  tr: { translation: tr },
  zh: { translation: zh },
  'zh-tw': { translation: zhTw },
};

export const supportedLanguages = Object.keys(translationResources);
