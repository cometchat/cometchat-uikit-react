import { FC, useCallback } from "react";
import { CometChatButton } from "../CometChatButton/CometChatButton";

interface CometChatClipboardImagePreviewProps {
  imageUrl: string;
  fileName: string;
  sendLabel: string;
  cancelLabel: string;
  isSending: boolean;
  onSend: () => void;
  onCancel: () => void;
}

const CometChatClipboardImagePreview: FC<CometChatClipboardImagePreviewProps> = ({
  imageUrl,
  fileName,
  sendLabel,
  cancelLabel,
  isSending,
  onSend,
  onCancel,
}) => {
  const handleSend = useCallback(() => {
    if (!isSending) {
      onSend();
    }
  }, [isSending, onSend]);

  const handleCancel = useCallback(() => {
    if (!isSending) {
      onCancel();
    }
  }, [isSending, onCancel]);

  return (
    <div className="cometchat-message-composer__clipboard-preview">
      <div className="cometchat-message-composer__clipboard-preview-image-wrapper">
        <img
          src={imageUrl}
          alt={fileName}
          className="cometchat-message-composer__clipboard-preview-image"
        />
      </div>
      <div className="cometchat-message-composer__clipboard-preview-details">
        <span className="cometchat-message-composer__clipboard-preview-title">
          {fileName}
        </span>
        <div className="cometchat-message-composer__clipboard-preview-actions">
          <CometChatButton
            text={sendLabel}
            isLoading={isSending}
            disabled={isSending}
            onClick={handleSend}
          />
          <button
            type="button"
            onClick={handleCancel}
            className="cometchat-message-composer__clipboard-preview-cancel"
            disabled={isSending}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export { CometChatClipboardImagePreview };
