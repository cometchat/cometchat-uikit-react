import { useCallback, useEffect, useState } from 'react';
import type { CometChat, FlagReason } from '@cometchat/chat-sdk-javascript';
import { getFlagReasons } from './CometChatFlagMessageDialogManager';

interface UseCometChatFlagMessageDialogOptions {
  message: CometChat.BaseMessage;
  onSubmit?: (messageId: string, reasonId: string, remark?: string) => Promise<boolean>;
  onError?: ((error: CometChat.CometChatException) => void) | null;
  onClose: () => void;
}

interface UseCometChatFlagMessageDialogReturn {
  flagReasons: FlagReason[];
  isLoadingReasons: boolean;
  selectedReason: FlagReason | null;
  selectReason: (reason: FlagReason) => void;
  remark: string;
  setRemark: (value: string) => void;
  errorMessage: string;
  setErrorMessage: (msg: string) => void;
  isLoading: boolean;
  handleSubmit: () => Promise<void>;
}

/**
 * Data hook for CometChatFlagMessageDialog.
 * Fetches flag reasons from SDK, manages selection, remark, and submission.
 */
export function useCometChatFlagMessageDialog({
  message,
  onSubmit,
  onError,
  onClose,
}: UseCometChatFlagMessageDialogOptions): UseCometChatFlagMessageDialogReturn {
  const [flagReasons, setFlagReasons] = useState<FlagReason[]>([]);
  const [isLoadingReasons, setIsLoadingReasons] = useState(true);
  const [selectedReason, setSelectedReason] = useState<FlagReason | null>(null);
  const [remark, setRemark] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingReasons(true);

    getFlagReasons()
      .then(reasons => {
        if (!cancelled) {
          setFlagReasons(reasons);
          setIsLoadingReasons(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setIsLoadingReasons(false);
          if (onError) {
            onError(error as CometChat.CometChatException);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onError]);

  const selectReason = useCallback((reason: FlagReason) => {
    setSelectedReason(reason);
    setErrorMessage('');
  }, []);

  const handleSubmit = useCallback(async () => {
    setErrorMessage('');
    if (!selectedReason) return;

    setIsLoading(true);
    try {
      if (onSubmit) {
        const trimmedRemark = remark.trim();
        const result = await onSubmit(
          String(message.getId()),
          selectedReason.id,
          trimmedRemark.length > 0 ? trimmedRemark : undefined
        );
        if (!result) {
          setErrorMessage('flag_message_error');
          setIsLoading(false);
          return;
        }
      }
      setIsLoading(false);
      onClose();
    } catch (error) {
      if (onError) {
        onError(error as CometChat.CometChatException);
      }
      setErrorMessage('flag_message_error');
      setIsLoading(false);
    }
  }, [selectedReason, remark, message, onSubmit, onError, onClose]);

  return {
    flagReasons,
    isLoadingReasons,
    selectedReason,
    selectReason,
    remark,
    setRemark,
    errorMessage,
    setErrorMessage,
    isLoading,
    handleSubmit,
  };
}
