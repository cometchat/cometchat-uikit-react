import React, { useEffect, useState } from 'react';
interface LinkPreviewProps {
  /**
   * URL of the link.
   */
  URL?: string,
  /**
   * Description of the link.
   */
  description?: string,
  /**
   * Title of the link.
   */
  title?: string,
  /**
   * URL of the image to display.
   */

  image?: string,
  /**
   * URL of the favicon to display.
   */
  favIconURL?: string,

  /**
   * Optional children to be displayed inside the link preview.
   */
  children?: React.ReactNode,
  /**
   * Function to handle click events on the link.
   */
  ccLinkClicked?: (url: string) => void,

  /** 
   * boolean value to toggle styling for sender and receiver message 
   */
  isSentByMe?: boolean
}

const defaultProps: Partial<LinkPreviewProps> = {
  favIconURL: "",
  title: "",
  description: "",
  URL: "",
  isSentByMe: true
};

const LinkPreview = (props: LinkPreviewProps) => {
  const {
    URL,
    description,
    title,
    image,
    favIconURL,
    children,
    isSentByMe,
    ccLinkClicked,
  } = { ...defaultProps, ...props };

  const [showFavIcon, setShowFavIcon] = useState(false);

  useEffect(() => {
    const img: any = new Image();
    img.src = favIconURL;
    img.onload = () => setShowFavIcon(true);
    img.onerror = () => setShowFavIcon(false);
  }, [favIconURL]);

  const handleClick = (e: any) => {
    if (ccLinkClicked && URL) {
      ccLinkClicked(URL);
    }
  };


  return (
    <div className="cometchat">
      <div
        className={`cometchat-link-bubble ${!isSentByMe ? "cometchat-link-bubble-incoming" : "cometchat-link-bubble-outgoing"}`}>
        {image && (
          <img
            className="cometchat-link-bubble__preview-image"
            src={image}
            alt={title}
            onClick={handleClick}
          />
        )}
        <div
          className={`cometchat-link-bubble__preview-body ${!image ? "cometchat-link-bubble__preview-body-rounded" : ""}`}
        >
          <div className="cometchat-link-bubble__preview-body-content" onClick={handleClick}>
            <div
              className="cometchat-link-bubble__preview-body-content-title"

            >
              {title}
            </div>
            <div
              className="cometchat-link-bubble__preview-body-content-description"
            >
              {description}
            </div>
            <div
              className="cometchat-link-bubble__preview-body-content-link"
            >
              {
             // Extract the domain name from the URL
              URL?.replace(/(^\w+:|^)\/\//, '').split('/')[0]
              }
            </div>
          </div>
          {favIconURL && showFavIcon && !image && (
            <img
              className="cometchat-link-bubble__preview-body-fav-icon"
              src={favIconURL}
              alt="icon"
              onClick={handleClick}
            />
          )}
        </div>
        <div
          className="cometchat-link-bubble__body"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export { LinkPreview };