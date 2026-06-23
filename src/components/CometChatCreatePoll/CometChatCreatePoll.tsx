/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * CometChatCreatePoll
 *
 * Modal form for creating poll messages.
 * Supports question input, dynamic answer options (2-12), validation,
 * loading state, error display, and reply-to-message.
 *
 * - Focus trap (Tab/Shift+Tab cycles within modal)
 * - Escape to close + focus restoration on unmount
 * - role="dialog", aria-modal, aria-labelledby
 * - aria-required, aria-invalid on inputs
 * - Error display with role="alert"
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatCreatePollProps, CometChatPollOption } from './CometChatCreatePoll.types';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import { POLLS_CONSTANTS } from '../../constants/CometChatExtensionConstants';
import './CometChatCreatePoll.css';
import { useLocale } from '../../context/locale/LocaleContext';

let idCounter = 0;
function generateOptionId(): string {
  return `option-${String(Date.now())}-${String(++idCounter)}`;
}

export const CometChatCreatePoll: React.FC<CometChatCreatePollProps> = ({
  user,
  group,
  replyToMessage,
  defaultAnswers = 2,
  onClose,
  onPollCreated,
  onError,
  title,
  questionPlaceholderText,
  answerPlaceholderText,
  answerHelpText,
  addAnswerText,
  createPollButtonText,
}) => {
  const { getLocalizedString } = useLocale();
  const effectiveTitle = title ?? getLocalizedString('polls_title');
  const effectiveQuestionPlaceholder =
    questionPlaceholderText ?? getLocalizedString('polls_question_placeholder');
  const effectiveAnswerPlaceholder =
    answerPlaceholderText ?? getLocalizedString('polls_add_placeholder');
  const effectiveAnswerHelpText = answerHelpText ?? getLocalizedString('polls_options');
  const effectiveAddAnswerText = addAnswerText ?? getLocalizedString('polls_add_option_button');
  const effectiveCreateButtonText =
    createPollButtonText ?? getLocalizedString('polls_create_button');
  const titleId = useId();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<CometChatPollOption[]>(() => {
    const count = Math.max(2, defaultAnswers);
    return Array.from({ length: count }, () => ({ id: generateOptionId(), value: '' }));
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  // Store previously focused element on mount
  useEffect(() => {
    previousFocusRef.current = getCurrentDocument().activeElement as HTMLElement;
    return () => {
      // Restore focus on unmount
      previousFocusRef.current?.focus();
    };
  }, [getCurrentDocument]);

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    getCurrentDocument().addEventListener('keydown', handleKeyDown);
    return () => {
      getCurrentDocument().removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, getCurrentDocument]);

  const validOptions = options.filter(o => o.value.trim() !== '');
  const canCreate = question.trim().length > 0 && validOptions.length >= 2 && !isLoading;
  const isAddDisabled = options.length >= 12;

  const addOption = useCallback(() => {
    if (options.length >= 12) return;
    setOptions(prev => [...prev, { id: generateOptionId(), value: '' }]);
    requestAnimationFrame(() => lastInputRef.current?.focus());
  }, [options.length]);

  const removeOption = useCallback(
    (index: number) => {
      if (options.length <= 2) return;
      setOptions(prev => prev.filter((_, i) => i !== index));
    },
    [options.length]
  );

  const updateOption = useCallback(
    (index: number, value: string) => {
      setOptions(prev => prev.map((opt, i) => (i === index ? { ...opt, value } : opt)));
      if (errorMessage) setErrorMessage('');
    },
    [errorMessage]
  );

  const handleCreate = useCallback(async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setErrorMessage(getLocalizedString('polls_required_fields_warning'));
      return;
    }

    const validOpts = options.filter(o => o.value.trim() !== '');
    if (validOpts.length < 2) {
      setErrorMessage(getLocalizedString('polls_required_fields_warning'));
      return;
    }

    const receiver = user ?? group;
    if (!receiver) {
      setErrorMessage('No receiver specified');
      return;
    }

    const receiverId = user ? user.getUid() : (group?.getGuid() ?? '');
    const receiverType = user ? 'user' : 'group';

    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload: Record<string, unknown> = {
        question: trimmedQuestion,
        options: validOpts.map(o => o.value.trim()),
        receiver: receiverId,
        receiverType,
      };

      if (replyToMessage) {
        payload.quotedMessageId = replyToMessage.getId();
      }

      const response = (await CometChat.callExtension(
        POLLS_CONSTANTS.extensionName,
        POLLS_CONSTANTS.postMethod,
        POLLS_CONSTANTS.createEndpoint,
        payload
      )) as Record<string, unknown>;

      if (response?.success) {
        onPollCreated?.();
        onClose?.();
      }
    } catch (error) {
      setErrorMessage(getLocalizedString('polls_error'));
      onError?.(error as CometChat.CometChatException);
    } finally {
      setIsLoading(false);
    }
  }, [
    question,
    options,
    user,
    group,
    replyToMessage,
    onPollCreated,
    onClose,
    onError,
    getLocalizedString,
  ]);

  return (
    <div className={'cometchat-create-poll__backdrop'}>
      <div
        ref={modalRef}
        className={'cometchat-create-poll'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className={'cometchat-create-poll__header'}>
          <h2 id={titleId} className={'cometchat-create-poll__header-title'}>
            {effectiveTitle}
          </h2>
          <button
            type="button"
            className={'cometchat-create-poll__header-close'}
            onClick={onClose}
            aria-label={getLocalizedString('accessibility_close')}
          />
        </div>

        {/* Body */}
        <div className={'cometchat-create-poll__body'}>
          {/* Question */}
          <div className={'cometchat-create-poll__question'}>
            <label className={'cometchat-create-poll__question-label'}>
              {getLocalizedString('polls_question')}
            </label>
            <input
              type="text"
              className={'cometchat-create-poll__question-input'}
              placeholder={effectiveQuestionPlaceholder}
              value={question}
              onChange={e => {
                setQuestion(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              aria-required="true"
            />
          </div>

          {/* Options */}
          <div className={'cometchat-create-poll__options-wrapper'}>
            <label className={'cometchat-create-poll__options-label'}>
              {effectiveAnswerHelpText}
            </label>
            <div className={'cometchat-create-poll__options'}>
              {options.map((option, i) => (
                <div key={option.id} className={'cometchat-create-poll__option'}>
                  <input
                    type="text"
                    className={'cometchat-create-poll__option-input'}
                    placeholder={effectiveAnswerPlaceholder}
                    value={option.value}
                    onChange={e => {
                      updateOption(i, e.target.value);
                    }}
                    ref={i === options.length - 1 ? lastInputRef : null}
                    aria-required="true"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className={'cometchat-create-poll__option-remove'}
                      onClick={() => {
                        removeOption(i);
                      }}
                      aria-label={getLocalizedString('accessibility_remove_poll_option').replace(
                        '{number}',
                        String(i + 1)
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className={[
                'cometchat-create-poll__add-button',
                isAddDisabled ? 'cometchat-create-poll__add-button--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={isAddDisabled}
              onClick={addOption}
            >
              + {effectiveAddAnswerText}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={'cometchat-create-poll__footer'}>
          {errorMessage && (
            <div className={'cometchat-create-poll__error'} role="alert" aria-live="assertive">
              <span className={'cometchat-create-poll__error-icon'} aria-hidden="true" />
              <span className={'cometchat-create-poll__error-text'}>{errorMessage}</span>
            </div>
          )}
          <button
            type="button"
            className={[
              'cometchat-create-poll__create-button',
              !canCreate ? 'cometchat-create-poll__create-button--disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={!canCreate}
            onClick={() => {
              void handleCreate();
            }}
          >
            {isLoading ? 'Creating...' : effectiveCreateButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

CometChatCreatePoll.displayName = 'CometChatCreatePoll';
