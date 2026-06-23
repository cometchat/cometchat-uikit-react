/**
 * LocaleProvider — initializes CometChatLocalize and provides getLocalizedString() via context.
 *
 * Part of the CometChatProvider tree:
 *   CometChatProvider > ... > LocaleProvider > CometChatEventsProvider > {children}
 */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { LocaleContext } from './LocaleContext';
import { CometChatLocalize } from '../../resources/CometChatLocalize/CometChatLocalize';
import type {
  TranslationContextValue,
  TranslateFunction,
} from '../../resources/CometChatLocalize/localize.types';

export interface LocaleProviderProps {
  locale?: string;
  localizeInstance?: CometChatLocalize;
  children: React.ReactNode;
}

export function LocaleProvider({ locale, localizeInstance, children }: LocaleProviderProps) {
  // Determine the initial language:
  // 1. Use explicit `locale` prop if provided
  // 2. Otherwise, delegate to the localize instance's getDefaultLanguage() which respects disableAutoDetection
  const language =
    locale ??
    localizeInstance?.getDefaultLanguage() ??
    new CometChatLocalize().getDefaultLanguage();

  const localize: CometChatLocalize = useMemo(() => {
    // If a custom instance is provided, use it.
    if (localizeInstance) {
      CometChatLocalize.setSharedInstance(localizeInstance);
      return localizeInstance;
    }
    // If CometChatUIKit.init() already created a shared instance, reuse it
    // (avoids overwriting the instance that init() configured).
    const existingShared = CometChatLocalize.getSharedInstance();
    if (existingShared) {
      // Update language if needed
      if (existingShared.currentLanguage !== language) {
        existingShared.setCurrentLanguage(language);
      }
      return existingShared;
    }
    // No existing instance — create a new one
    const instance = new CometChatLocalize({ language });
    CometChatLocalize.setSharedInstance(instance);
    return instance;
  }, [localizeInstance, language]);

  const [translators, setTranslators] = useState<TranslationContextValue>(() => {
    const translator = localize.getTranslators();
    return {
      getLocalizedString: translator.t,
      tDateTimeParser: translator.tDateTimeParser,
      language: localize.currentLanguage,
      timezone: localize.getTimezone(),
      calendarObject: localize.getCalendarObject(),
      dateLocaleLanguage: localize.getDateLocaleLanguage(),
    };
  });

  useEffect(() => {
    localize.registerSetLanguageCallback((t: TranslateFunction) => {
      setTranslators(prev => ({
        ...prev,
        getLocalizedString: t,
        dateLocaleLanguage: localize.getDateLocaleLanguage(),
      }));
    });

    const translator = localize.getTranslators();
    setTranslators({
      getLocalizedString: translator.t,
      tDateTimeParser: translator.tDateTimeParser,
      language: localize.currentLanguage,
      timezone: localize.getTimezone(),
      calendarObject: localize.getCalendarObject(),
      dateLocaleLanguage: localize.getDateLocaleLanguage(),
    });
  }, [localize]);

  return <LocaleContext.Provider value={translators}>{children}</LocaleContext.Provider>;
}
