/**
 * Barrel export of all sample-app translation JSON files.
 *
 * These translations are sample-app-specific strings (empty states, login UI,
 * group management dialogs, etc.) that get merged into the UIKit's
 * CometChatLocalize instance via addTranslation().
 */
import enUs from './en-us.json';
import enGb from './en-gb.json';
import de from './de.json';
import es from './es.json';
import fr from './fr.json';
import hi from './hi.json';
import hu from './hu.json';
import it from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import lt from './lt.json';
import ms from './ms.json';
import nl from './nl.json';
import pt from './pt.json';
import ru from './ru.json';
import sv from './sv.json';
import tr from './tr.json';
import zh from './zh.json';
import zhTw from './zh-tw.json';

export const sampleAppTranslations: Record<string, Record<string, string>> = {
  'en-us': enUs,
  'en-gb': enGb,
  de,
  es,
  fr,
  hi,
  hu,
  it,
  ja,
  ko,
  lt,
  ms,
  nl,
  pt,
  ru,
  sv,
  tr,
  zh,
  'zh-tw': zhTw,
};
