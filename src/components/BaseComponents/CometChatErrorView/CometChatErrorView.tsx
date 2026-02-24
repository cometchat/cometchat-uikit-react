import React from 'react';
interface CometChatErrorViewProps {
  /**
   * Custom error message to display
   */
  message: string;
}

export const CometChatErrorView: React.FC<CometChatErrorViewProps> = ({
  message
}) => {
  return (
    <div 
      className="cometchat-error-view"
      role="alert"
      aria-live="assertive"
    >
      <div className="cometchat-error-view__container">
        <div className="cometchat-error-view__content">
          <div className="cometchat-error-view__message">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CometChatErrorView;
