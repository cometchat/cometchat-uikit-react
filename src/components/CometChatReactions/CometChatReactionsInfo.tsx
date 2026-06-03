import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatReactionsInfoProps } from './CometChatReactions.types';
import { useCometChatReactionsContext } from './CometChatReactions.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatReactions.css';

const INFO_LIMIT = 3;

type InfoState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * CometChatReactionsInfo — hover tooltip showing who reacted with a specific emoji.
 *
 * Fetches reactor names on mount and displays them in a dark tooltip.
 */
export const CometChatReactionsInfo: React.FC<CometChatReactionsInfoProps> = ({
  emoji,
  className,
}) => {
  const { message, reactionsRequestBuilder } = useCometChatReactionsContext();
  const { getLocalizedString } = useLocale();
  const [names, setNames] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [infoState, setInfoState] = useState<InfoState>('idle');
  const fetchedRef = useRef(false);

  // Compute total count for this emoji from message reactions
  useEffect(() => {
    const reactions = message.getReactions();
    const match = reactions.find((r: CometChat.ReactionCount) => r.getReaction() === emoji);
    setTotalCount(match ? match.getCount() : 0);
  }, [message, emoji]);

  // Fetch reactor names on mount
  const fetchReactorNames = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Guard: skip SDK calls entirely if SDK is not initialized
    if (!CometChat.isInitialized()) {
      setInfoState('loaded');
      return;
    }

    setInfoState('loading');

    try {
      const messageId = message.getId();
      if (!messageId) {
        setInfoState('loaded');
        return;
      }

      const builder =
        reactionsRequestBuilder ?? new CometChat.ReactionsRequestBuilder().setLimit(INFO_LIMIT);
      builder.setMessageId(messageId);
      builder.setReaction(emoji);
      const request = builder.build();
      const reactors = await request.fetchNext();

      // Get logged-in user to show "You" instead of own name
      let loggedInUid: string | undefined;
      try {
        const loggedInUser = await CometChat.getLoggedinUser();
        loggedInUid = loggedInUser?.getUid();
      } catch {
        // skip "You" substitution
      }

      const fetchedNames: string[] = [];
      for (const reactor of reactors) {
        const reactedBy = reactor.getReactedBy();
        if (loggedInUid && reactedBy.getUid() === loggedInUid) {
          fetchedNames.unshift(getLocalizedString('reaction_popup_you') || 'You');
        } else {
          fetchedNames.push(reactedBy.getName());
        }
      }

      setNames(fetchedNames);
      setInfoState('loaded');
    } catch {
      setInfoState('loaded');
    }
  }, [message, emoji, reactionsRequestBuilder, getLocalizedString]);

  useEffect(() => {
    void fetchReactorNames();
  }, [fetchReactorNames]);

  const infoClass = ['cometchat-reactions__info', className ?? ''].filter(Boolean).join(' ');

  const pendingCount = totalCount - names.length;

  return (
    <div className={infoClass} role="tooltip">
      <div className={'cometchat-reactions__info-content'}>
        {infoState === 'loading' && <div className={'cometchat-reactions__info-loading'} />}
        {infoState === 'error' && (
          <div className={'cometchat-reactions__info-error'}>
            {getLocalizedString('error_text') || 'Failed to load'}
          </div>
        )}
        {infoState === 'loaded' && (
          <div className={'cometchat-reactions__info-emoji-text'}>
            <span className={'cometchat-reactions__info-emoji'}>{emoji}</span>
            <div>
              <div className={'cometchat-reactions__info-title'}>
                {names.join(', ')}
                {pendingCount > 0 &&
                  ` ${getLocalizedString('reaction_popup_and') || 'and'} ${String(pendingCount)} ${getLocalizedString('reaction_popup_others') || 'others'}`}
              </div>
              <div className={'cometchat-reactions__info-description'}>
                {getLocalizedString('reaction_reacted') || 'reacted'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
