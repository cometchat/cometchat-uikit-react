import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LocaleProvider } from '../LocaleProvider';
import { useLocale } from '../LocaleContext';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/CometChatLocalize';

/** Helper component that reads from useLocale() and displays context values. */
function LocaleConsumer() {
  const ctx = useLocale();
  return (
    <div>
      <span data-testid="language">{ctx.language}</span>
      <span data-testid="dateLocaleLanguage">{ctx.dateLocaleLanguage}</span>
      <span data-testid="timezone">{ctx.timezone ?? 'undefined'}</span>
      <span data-testid="calendarObject">
        {ctx.calendarObject ? JSON.stringify(ctx.calendarObject) : 'undefined'}
      </span>
    </div>
  );
}

describe('LocaleProvider — context expansion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes timezone from the CometChatLocalize instance', () => {
    const i18n = new CometChatLocalize({ language: 'en-us' });
    i18n.init({ timezone: 'America/Chicago' });

    render(
      <LocaleProvider i18nInstance={i18n}>
        <LocaleConsumer />
      </LocaleProvider>
    );

    expect(screen.getByTestId('timezone').textContent).toBe('America/Chicago');
  });

  it('exposes calendarObject from the CometChatLocalize instance', () => {
    const i18n = new CometChatLocalize({ language: 'en-us' });
    const config = { today: 'hh:mm A', yesterday: 'Yesterday' };
    i18n.init({ calendarObject: config });

    render(
      <LocaleProvider i18nInstance={i18n}>
        <LocaleConsumer />
      </LocaleProvider>
    );

    expect(screen.getByTestId('calendarObject').textContent).toBe(JSON.stringify(config));
  });

  it('exposes dateLocaleLanguage from the CometChatLocalize instance', () => {
    const i18n = new CometChatLocalize({ language: 'de' });

    render(
      <LocaleProvider i18nInstance={i18n}>
        <LocaleConsumer />
      </LocaleProvider>
    );

    expect(screen.getByTestId('dateLocaleLanguage').textContent).toBe('de');
  });

  it('shows timezone as undefined when not configured', () => {
    const i18n = new CometChatLocalize({ language: 'en-us' });

    render(
      <LocaleProvider i18nInstance={i18n}>
        <LocaleConsumer />
      </LocaleProvider>
    );

    expect(screen.getByTestId('timezone').textContent).toBe('undefined');
  });

  it('updates dateLocaleLanguage when setCurrentLanguage is called', () => {
    const i18n = new CometChatLocalize({ language: 'en-us' });

    render(
      <LocaleProvider i18nInstance={i18n}>
        <LocaleConsumer />
      </LocaleProvider>
    );

    expect(screen.getByTestId('dateLocaleLanguage').textContent).toBe('en-us');

    act(() => {
      i18n.setCurrentLanguage('fr');
    });

    expect(screen.getByTestId('dateLocaleLanguage').textContent).toBe('fr');
  });

  it('disableAutoDetection prevents browser language detection and uses fallback', () => {
    vi.stubGlobal('window', {
      document: window.document,
      navigator: {
        language: 'de',
        languages: ['de'],
      },
    });

    const i18n = new CometChatLocalize({ language: 'en-us', fallbackLanguage: 'fr' });
    i18n.init({ disableAutoDetection: true });

    // When disableAutoDetection is true, getDefaultLanguage returns fallback
    expect(i18n.getDefaultLanguage()).toBe('fr');

    render(
      <LocaleProvider i18nInstance={i18n}>
        <LocaleConsumer />
      </LocaleProvider>
    );

    // The instance language should remain as set, not auto-detected
    expect(screen.getByTestId('language').textContent).toBe('en-us');
  });

  it('uses provided i18nInstance prop', () => {
    const i18n = new CometChatLocalize({ language: 'ja' });
    i18n.addTranslation({ ja: { HELLO: 'こんにちは' } });
    i18n.setCurrentLanguage('ja');

    function TranslationConsumer() {
      const { getLocalizedString } = useLocale();
      return <span data-testid="translated">{getLocalizedString('HELLO')}</span>;
    }

    render(
      <LocaleProvider i18nInstance={i18n}>
        <TranslationConsumer />
      </LocaleProvider>
    );

    expect(screen.getByTestId('translated').textContent).toBe('こんにちは');
  });

  it('multiple LocaleProvider instances operate independently', () => {
    const i18n1 = new CometChatLocalize({ language: 'en-us' });
    i18n1.init({ timezone: 'UTC' });

    const i18n2 = new CometChatLocalize({ language: 'de' });
    i18n2.init({ timezone: 'Europe/Berlin' });

    function Consumer({ testId }: { testId: string }) {
      const ctx = useLocale();
      return (
        <div>
          <span data-testid={`${testId}-lang`}>{ctx.language}</span>
          <span data-testid={`${testId}-tz`}>{ctx.timezone ?? 'undefined'}</span>
        </div>
      );
    }

    render(
      <div>
        <LocaleProvider i18nInstance={i18n1}>
          <Consumer testId="first" />
        </LocaleProvider>
        <LocaleProvider i18nInstance={i18n2}>
          <Consumer testId="second" />
        </LocaleProvider>
      </div>
    );

    expect(screen.getByTestId('first-lang').textContent).toBe('en-us');
    expect(screen.getByTestId('first-tz').textContent).toBe('UTC');
    expect(screen.getByTestId('second-lang').textContent).toBe('de');
    expect(screen.getByTestId('second-tz').textContent).toBe('Europe/Berlin');
  });
});
