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
import {
  defaultTranslatorFunction,
  defaultDateTimeParser,
} from '../../resources/CometChatLocalize/localize.utils';
import type {
  TranslationContextValue,
  TranslateFunction,
} from '../../resources/CometChatLocalize/localize.types';

export interface LocaleProviderProps {
  locale?: string;
  i18nInstance?: CometChatLocalize;
  children: React.ReactNode;
}

export function LocaleProvider({ locale, i18nInstance, children }: LocaleProviderProps) {
  // Determine the initial language:
  // 1. Use explicit `locale` prop if provided
  // 2. Otherwise, delegate to the i18n instance's getDefaultLanguage() which respects disableAutoDetection
  const language =
    locale ?? i18nInstance?.getDefaultLanguage() ?? new CometChatLocalize().getDefaultLanguage();

  const i18n: CometChatLocalize = useMemo(() => {
    const instance = i18nInstance ?? new CometChatLocalize({ language });
    CometChatLocalize.setSharedInstance(instance);
    return instance;
  }, [i18nInstance, language]);

  const [translators, setTranslators] = useState<TranslationContextValue>({
    getLocalizedString: defaultTranslatorFunction,
    tDateTimeParser: defaultDateTimeParser,
    language,
    dateLocaleLanguage: language,
  });

  useEffect(() => {
    i18n.registerSetLanguageCallback((t: TranslateFunction) => {
      setTranslators(prev => ({
        ...prev,
        getLocalizedString: t,
        dateLocaleLanguage: i18n.getDateLocaleLanguage(),
      }));
    });

    const translator = i18n.getTranslators();
    setTranslators({
      getLocalizedString: translator.t,
      tDateTimeParser: translator.tDateTimeParser,
      language: i18n.currentLanguage,
      timezone: i18n.getTimezone(),
      calendarObject: i18n.getCalendarObject(),
      dateLocaleLanguage: i18n.getDateLocaleLanguage(),
    });
  }, [i18n]);

  return <LocaleContext.Provider value={translators}>{children}</LocaleContext.Provider>;
}
