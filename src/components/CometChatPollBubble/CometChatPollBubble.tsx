/**
 * CometChatPollBubble
 *
 * Renders poll messages with voting functionality.
 *
 * Self-extracting: takes the SDK CustomMessage and derives the question, options,
 * vote counts, total votes and the logged-in user's voted option itself. The
 * logged-in user (from useLoggedInUser) and localization (from useLocale) come
 * from hooks, so the bubble can be used directly without a plugin.
 *
 * Features:
 * - Optimistic UI with rollback on vote error
 * - Vote change support (click different option to change vote)
 * - Non-blocking API calls (fire-and-forget)
 * - Stacked voter avatars (up to 3)
 * - Progress bars with sender/receiver color variants
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatPollBubbleProps,
  CometChatPollData,
  CometChatPollBubbleOption,
} from './CometChatPollBubble.types';
import { extractPollData, processPollOptions } from './polls.utils';
import { POLLS_CONSTANTS } from '../../constants/CometChatExtensionConstants';
import './CometChatPollBubble.css';
import { useLocale } from '../../hooks/useLocale';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';

export const CometChatPollBubble: React.FC<CometChatPollBubbleProps> = ({
  message,
  alignment,
  disableInteraction = false,
  onVoteSubmit,
  onVoteError,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const loggedInUser = useLoggedInUser();
  const isOutgoing = (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right';
  const loggedInUserUid = loggedInUser?.getUid();

  const initialPollData = useMemo(() => extractPollData(message), [message]);
  const [pollData, setPollData] = useState<CometChatPollData | null>(initialPollData);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const newData = extractPollData(message);
    if (newData) {
      setPollData(newData);
    }
  }, [message]);

  const pollOptions = useMemo(
    () => (pollData ? processPollOptions(pollData, loggedInUserUid) : []),
    [pollData, loggedInUserUid]
  );

  const handleOptionClick = useCallback(
    (option: CometChatPollBubbleOption) => {
      if (disableInteraction || !pollData) return;

      const previousPollData = pollData;
      const newResults = { ...pollData.results };
      newResults.options = { ...newResults.options };

      const previouslySelected = pollOptions.find(opt => opt.selectedByLoggedInUser);

      // Decrement previous option if changing vote
      if (previouslySelected && previouslySelected.id !== option.id) {
        const prevResult = newResults.options[previouslySelected.id];
        if (prevResult) {
          if (loggedInUserUid) {
            // Omit the current user's vote from the voters map via destructuring.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [loggedInUserUid]: _removed, ...rest } = prevResult.voters;
            newResults.options[previouslySelected.id] = {
              ...prevResult,
              count: Math.max(0, prevResult.count - 1),
              voters: rest,
            };
          } else {
            newResults.options[previouslySelected.id] = {
              ...prevResult,
              count: Math.max(0, prevResult.count - 1),
              voters: { ...prevResult.voters },
            };
          }
        }
        newResults.total = Math.max(0, newResults.total - 1);
      }

      // Increment selected option if different from current
      if (previouslySelected?.id !== option.id && loggedInUserUid) {
        const selectedResult = newResults.options[option.id] ?? { count: 0, voters: {} };
        newResults.options[option.id] = {
          ...selectedResult,
          count: selectedResult.count + 1,
          voters: {
            ...selectedResult.voters,
            [loggedInUserUid]: {
              name: loggedInUser?.getName() ?? '',
              avatar: loggedInUser?.getAvatar(),
            },
          },
        };
        newResults.total = newResults.total + 1;
      }

      setPollData({ ...pollData, results: newResults });

      CometChat.callExtension(
        POLLS_CONSTANTS.extensionName,
        POLLS_CONSTANTS.postMethod,
        POLLS_CONSTANTS.voteEndpoint,
        { vote: option.id, id: pollData.id }
      )
        .then(() => {
          onVoteSubmit?.({
            pollId: pollData.id,
            optionId: option.id,
            optionText: option.text,
            message,
          });
          setAnnouncement(`Vote submitted for ${option.text}`);
        })
        .catch((error: unknown) => {
          setPollData(previousPollData);
          onVoteError?.({
            pollId: pollData.id,
            optionId: option.id,
            error: error instanceof Error ? error : new Error(String(error)),
            message,
          });
        });
    },
    [
      disableInteraction,
      pollData,
      pollOptions,
      loggedInUserUid,
      loggedInUser,
      message,
      onVoteSubmit,
      onVoteError,
    ]
  );

  const handleOptionKeyDown = useCallback(
    (event: React.KeyboardEvent, option: CometChatPollBubbleOption) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOptionClick(option);
      }
    },
    [handleOptionClick]
  );

  if (!pollData) return null;

  const variantClass = isOutgoing
    ? 'cometchat-poll-bubble--outgoing'
    : 'cometchat-poll-bubble--incoming';

  const rootClasses = ['cometchat-poll-bubble', variantClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClasses}
      role="group"
      aria-label={getLocalizedString('accessibility_poll_question').replace(
        '{question}',
        pollData.question
      )}
    >
      {/* Question */}
      <div className={'cometchat-poll-bubble__question'}>{pollData.question}</div>

      {/* Options */}
      <ul
        className={'cometchat-poll-bubble__options'}
        role="radiogroup"
        aria-label={getLocalizedString('accessibility_poll_options')}
      >
        {pollOptions.map(option => (
          <li
            key={option.id}
            className={'cometchat-poll-bubble__option'}
            role="radio"
            aria-checked={option.selectedByLoggedInUser}
            aria-label={`${option.text}, ${getLocalizedString('accessibility_vote_count').replace('{count}', String(option.count))}, ${option.percent}`}
            tabIndex={disableInteraction ? -1 : 0}
            onClick={() => {
              handleOptionClick(option);
            }}
            onKeyDown={e => {
              handleOptionKeyDown(e, option);
            }}
          >
            {/* Radio circle */}
            <div className={'cometchat-poll-bubble__option-radio'} aria-hidden="true">
              <div
                className={[
                  'cometchat-poll-bubble__option-radio-circle',
                  option.selectedByLoggedInUser
                    ? 'cometchat-poll-bubble__option-radio-circle--selected'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>

            {/* Body */}
            <div className={'cometchat-poll-bubble__option-body'}>
              {/* Content row: text + tail */}
              <div className={'cometchat-poll-bubble__option-content'}>
                <div className={'cometchat-poll-bubble__option-text'}>{option.text}</div>
                <div className={'cometchat-poll-bubble__option-tail'} aria-hidden="true">
                  {/* Voter avatars */}
                  {option.voters.length > 0 && (
                    <div className={'cometchat-poll-bubble__option-avatars'}>
                      {option.voters.map((voter, index) => {
                        const isLast = index === option.voters.length - 1;
                        return (
                          <div
                            key={index}
                            className={[
                              'cometchat-poll-bubble__option-avatar',
                              isLast ? 'cometchat-poll-bubble__option-avatar--last' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            style={{ zIndex: index }}
                          >
                            {voter.avatar ? (
                              <img
                                src={voter.avatar}
                                alt={voter.name}
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <span className={'cometchat-poll-bubble__option-avatar-initials'}>
                                {voter.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Vote count */}
                  <div className={'cometchat-poll-bubble__option-count'}>{option.count}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className={'cometchat-poll-bubble__option-progress'}
                role="progressbar"
                aria-valuenow={parseInt(option.percent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={getLocalizedString('accessibility_of_votes').replace(
                  '{percent}',
                  option.percent
                )}
              >
                <div
                  className={'cometchat-poll-bubble__option-progress-bar'}
                  style={{ width: option.percent }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Screen reader announcement */}
      <div aria-live="polite" aria-atomic="true" className={'cometchat-poll-bubble__sr-only'}>
        {announcement}
      </div>
    </div>
  );
};

CometChatPollBubble.displayName = 'CometChatPollBubble';

export default CometChatPollBubble;
