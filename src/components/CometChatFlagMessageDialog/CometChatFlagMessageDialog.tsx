import { CometChat, FlagReason } from "@cometchat/chat-sdk-javascript";
import { getLocalizedString } from "../../resources/CometChatLocalize/cometchat-localize";
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";
import { useEffect, useState } from "react";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";

interface CometChatFlagMessageDialogProps {
  message: CometChat.BaseMessage;
  /**   
   * Callback triggered when the dialog is closed.
   * @returns void
   */
  onClose?: () => void;
  /**
   * Callback triggered when an error occurs when trying to flag a message.
   * @param error - An instance of `CometChat.CometChatException` representing the error.
   * @returns void
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /**
   * Callback triggered when the flag report is submitted.
   * @param messageId - ID of the message being flagged.
   * @param reasonId - ID of the reason for flagging the message.
   * @param remark - Optional remark provided by the user.
   * @returns A promise that resolves to a boolean indicating the success of the flagging operation.
   */
  onSubmit?: (
    messageId: string,
    reasonId: string,
    remark?: string
  ) => Promise<boolean>;
  /**
   * Boolean to hide the remark input field.
   * @defaultValue `false`
   */
  hideFlagRemarkField?: boolean;
}

const CometChatFlagMessageDialog = (props: CometChatFlagMessageDialogProps) => {
  const {
    message,
    onClose,
    onError,
    onSubmit,
    hideFlagRemarkField = false,
  } = props;

  const onErrorCallback = useCometChatErrorHandler(onError);

  const [flagReasons, setFlagReasons] = useState<FlagReason[]>([]);
  const [selectedFlagReason, setSelectedFlagReason] =
    useState<FlagReason | null>(null);
  const [remark, setRemark] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const reasons = await CometChat.getFlagReasons();
        setFlagReasons(reasons);
      } catch (error) {
        onErrorCallback(error, "fetchFlagReasons");
      }
    })();
  }, [onErrorCallback, setFlagReasons]);

  const toggleReason = (reason: FlagReason) => {
    setSelectedFlagReason(reason);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setIsLoading(true);
    if (!selectedFlagReason) {
      setIsLoading(false);
      return;
    }
    try {
      if (onSubmit) {
        const submitResult = await onSubmit(
          String(message.getId()),
          selectedFlagReason.id,
          remark.trim().length > 0 ? remark.trim() : undefined
        );
        if (!submitResult) {
          setErrorMessage(getLocalizedString("flag_message_error"));
          setIsLoading(false);
          return;
        }
      }
      if (onClose) {
        onClose();
      }
      setIsLoading(false);
    } catch (error) {
      onErrorCallback(error, "flagMessageSubmit");
      setErrorMessage(getLocalizedString("flag_message_error"));
      setIsLoading(false);
    }
  };

  const validateAndSetRemark = (value: string) => {
    if(value.length > 500) setErrorMessage(getLocalizedString("flag_message_character_limit_reached"));
    else setErrorMessage("")
    setRemark(value.substring(0, 500));
  };

  return (
    <div
      className="cometchat cometchat-flag-message-dialog"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cometchat-flag-message-dialog__header">
        <div className="cometchat-flag-message-dialog__header-main">
          <div className="cometchat-flag-message-dialog__header-title">
            {getLocalizedString("flag_message_title")}
          </div>
        </div>
        <div className="cometchat-flag-message-dialog__header-subtitle">
          {getLocalizedString("flag_message_subtitle")}
        </div>
      </div>
      <div className="cometchat-flag-message-dialog__body">
        <div className="cometchat-flag-message-dialog__reasons" role="group">
          {flagReasons.map((flagReason) => (
            <button
              key={flagReason.id}
              type="button"
              className={`cometchat-flag-message-dialog__reason ${selectedFlagReason?.id === flagReason.id ? "cometchat-flag-message-dialog__reason-selected" : ""}`}
              onClick={() => toggleReason(flagReason)}
            >
              {getLocalizedString(`flag_message_reason_id_${flagReason.id}`) ||
                flagReason.name}
            </button>
          ))}
        </div>
        {!hideFlagRemarkField && (
          <div className="cometchat-flag-message-dialog__remark">
            <label
              htmlFor="flag-message__remark"
              className="cometchat-flag-message-dialog__remark-label"
            >
              {getLocalizedString("flag_message_remark_label")}{" "}
              <span>({getLocalizedString("flag_message_remark_optional")})</span>
            </label>
            <textarea
              name="flag-message__remark"
              id="flag-message__remark"
              placeholder={getLocalizedString("flag_message_remark_placeholder")}
              className="cometchat-flag-message-dialog__remark-input"
              value={remark}
              onChange={(e) => validateAndSetRemark(e.target.value)}
              onClick={() => setErrorMessage("")}
            />
          </div>
        )}
        <div className="cometchat-flag-message-dialog__error">
          {errorMessage}
        </div>
        <div className="cometchat-flag-message-dialog__actions">
          <div className="cometchat-flag-message-dialog__actions-item cometchat-flag-message-dialog__actions-cancel">
            <CometChatButton
              onClick={onClose}
              text={getLocalizedString("flag_message_confirm_no")}
            />
          </div>
          <div className="cometchat-flag-message-dialog__actions-item  cometchat-flag-message-dialog__actions-submit">
            <CometChatButton
              disabled={!selectedFlagReason}
              isLoading={isLoading}
              text={getLocalizedString("flag_message_confirm_yes")}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export { CometChatFlagMessageDialog };
