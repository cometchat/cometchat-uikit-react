import type { CometChatDateRootProps } from './CometChatDate.types';
import { CometChatDateContext } from './CometChatDate.context';
import { useCometChatDate } from './useCometChatDate';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatDate.css';

export function CometChatDateRoot({
  timestamp,
  formatConfig,
  formatter,
  variant = 'caption',
  className,
  children,
}: CometChatDateRootProps) {
  const { calendarObject, timezone, dateLocaleLanguage, getLocalizedString } = useLocale();

  // Use component-level formatConfig if provided; otherwise fall back to global calendarObject from context.
  // Inject localized "Today" / "Yesterday" strings when the effective config uses the defaults.
  const baseConfig = formatConfig ?? calendarObject;
  const effectiveFormatConfig = baseConfig
    ? {
        ...baseConfig,
        today: baseConfig.today ?? getLocalizedString('date_today'),
        yesterday: baseConfig.yesterday ?? getLocalizedString('date_yesterday'),
      }
    : {
        today: getLocalizedString('date_today'),
        yesterday: getLocalizedString('date_yesterday'),
      };

  const { formattedDate, isoDate, fullDateLabel } = useCometChatDate({
    timestamp,
    formatConfig: effectiveFormatConfig,
    ...(formatter != null && { formatter }),
    ...(timezone != null && { timezone }),
    locale: dateLocaleLanguage,
  });

  const contextValue = { timestamp, formattedDate, isoDate, fullDateLabel, variant };

  return (
    <CometChatDateContext.Provider value={contextValue}>
      <time
        className={`cometchat-date ${className ?? ''}`}
        dateTime={isoDate}
        aria-label={fullDateLabel}
        title={fullDateLabel}
        data-variant={variant}
      >
        {children ?? <span className={'cometchat-date__text'}>{formattedDate}</span>}
      </time>
    </CometChatDateContext.Provider>
  );
}
