import { FC, useCallback } from "react";

interface CometChatClipboardImagePreviewProps {
  imageUrl: string;
  fileName: string;
  cancelLabel: string;
  isSending: boolean;
  statusText?: string;
  onCancel: () => void;
}

const CometChatClipboardImagePreview: FC<CometChatClipboardImagePreviewProps> = ({
  imageUrl,
  fileName,
  cancelLabel,
  isSending,
  statusText,
  onCancel,
}) => {
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
        {isSending && statusText ? (
          <span className="cometchat-message-composer__clipboard-preview-status">
            {statusText}
          </span>
        ) : null}
        <div className="cometchat-message-composer__clipboard-preview-actions">
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
