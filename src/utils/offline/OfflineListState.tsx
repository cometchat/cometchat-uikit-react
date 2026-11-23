/**
 * The body of a list's offline state (D84): an icon and one line of text, with
 * an optional second line, and no Retry button. A list renders it where its
 * error view (nothing to load while offline) or its empty view (a keyword
 * search while offline) would go, so the look is the list's own: the classes
 * are the list's `<block>-icon`, `-title` and `-subtitle`.
 *
 * @internal
 */
import React from 'react';

export interface OfflineListStateProps {
  /** The list's state block class, for example `cometchat-users__error-state`. */
  block: string;
  /** The list's empty-state icon (a data URL). */
  icon: string;
  title: string;
  subtitle?: string;
}

export const OfflineListState: React.FC<OfflineListStateProps> = ({
  block,
  icon,
  title,
  subtitle,
}) => (
  <>
    <div className={`${block}-icon`} aria-hidden="true">
      <img src={icon} alt="" width={120} height={120} loading="lazy" decoding="async" />
    </div>
    <div className={`${block}-title`}>{title}</div>
    {subtitle !== undefined && <div className={`${block}-subtitle`}>{subtitle}</div>}
  </>
);
