import { useState, useEffect, useCallback, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { StickersConstants } from './StickersConstants';
import {getLocalizedString} from '../../../resources/CometChatLocalize/cometchat-localize';
import { States } from '../../../Enums/Enums';
import React from 'react';


interface StickerItem {
  /**
  * The URL of the sticker image.
  */
  stickerUrl: string;

  /**
   * The name of the sticker set to which this sticker belongs.
   */
  stickerSetName: string;

  /**
   * The order of the sticker within its set.
   */
  stickerOrder?: number;
}

interface StickerSet {
  /**
    * A collection of sticker items grouped by their set name.
    */
  [key: string]: StickerItem[];
}

interface StickersKeyboardProps {
  /**
   * Text to display when there is an error state.
   * @default "SOMETHING_WRONG"
   */
  errorStateText?: string;

  /**
   * Text to display when no stickers are found.
   * @default "NO_STICKERS_FOUND"
   */
  emptyStateText?: string;

  /**
   * Callback function triggered when a sticker is clicked.
   */
  ccStickerClicked: (event: { detail: { stickerURL: string, stickerName: string } }) => void;
}

const defaultProps: Partial<StickersKeyboardProps> = {
  errorStateText: getLocalizedString('sticker_error'),
  emptyStateText: getLocalizedString('sticker_empty'),
}

/**
 * A keyboard component that allows users to select and send stickers.
 * @component
 * @param {StickersKeyboardProps} props - The props for the component.
 * @returns {JSX.Element}
 */
const StickersKeyboard = (props: StickersKeyboardProps) => {
  const { errorStateText, emptyStateText, ccStickerClicked } = { ...defaultProps, ...props }
  const [state, setState] = useState<States>(States.loading);
  const [stickerSet, setStickerSet] = useState<StickerSet>({});
  const [activeStickerList, setActiveStickerList] = useState<StickerItem[]>([]);
  const [categoryStickerUrl, setCategoryStickerUrl] = useState<StickerItem[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /**
   * Fetches the stickers from the CometChat extension and updates the state with the fetched stickers.
   * If no stickers are found, it updates the state to `States.empty`.
   * In case of an error during fetching, it sets the state to `States.error`.
   * 
   * @async
   * @function fetchStickers
   * @returns {Promise<void>} 
   */
  const fetchStickers = useCallback(async () => {
    setState(States.loading);
    try {
      const stickers: any = await CometChat.callExtension(StickersConstants.stickers, StickersConstants.get, StickersConstants.v1_fetch);
      let activeStickerSet: string | null = null;
      const customStickers: StickerItem[] = stickers?.customStickers ? [stickers.customStickers] : [];
      const defaultStickers: StickerItem[] = stickers.defaultStickers || [];

      defaultStickers.sort((a, b) => (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0));
      customStickers.sort((a, b) => (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0));

      const stickerList = [...defaultStickers, ...customStickers].flat();

      if (stickerList.length === 0) {
        setState(States.empty);
        return;
      }

      const stickerSet = stickerList.reduce<StickerSet>((acc, sticker, index) => {
        const { stickerSetName } = sticker;
        if (index === 0) {
          activeStickerSet = stickerSetName;
        }
        acc[stickerSetName] = [...(acc[stickerSetName] || []), { ...sticker }];
        return acc;
      }, {});

      Object.keys(stickerSet).forEach(key => {
        stickerSet[key].sort((a, b) => (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0));
      });

      if (activeStickerSet !== null) {
        setActiveStickerList(stickerSet[activeStickerSet]);
      }

      setStickerSet(stickerSet);
      setState(States.loaded);

      const categoryUrls = Object.keys(stickerSet).map(sectionItem => stickerSet[sectionItem][0]);
      setCategoryStickerUrl(categoryUrls);
      if (!activeTab) {
        setActiveTab(categoryUrls?.[0]?.stickerSetName);
      }
    } catch (error) {
      console.error(error);
      setState(States.error);
    }
  }, []);

  /**
   * Fetches stickers when the component is mounted.
   * 
   * @function useEffect
   * @memberof StickersKeyboard
   */
  useEffect(() => {
    fetchStickers();
  }, [fetchStickers]);

  /**
   * Handles the event when a sticker set is clicked, updating the active stickers list to display.
   * 
   * @function stickerSetClicked
   * @param {string} sectionItem - The name of the sticker set that was clicked.
   */
  const stickerSetClicked = (sectionItem: string) => {
    setActiveStickerList(stickerSet[sectionItem] || []);
    setActiveTab(sectionItem)
  };

  /**
   * Handles the event when a sticker is clicked, triggering the `ccStickerClicked` callback with the sticker's details.
   * 
   * @function sendStickerMessage
   * @param {StickerItem} stickerItem - The sticker item that was clicked.
   */
  const sendStickerMessage = (stickerItem: StickerItem) => {
    ccStickerClicked({
      detail: {
        stickerURL: stickerItem.stickerUrl, stickerName: stickerItem.stickerSetName
      }
    });
  };

  /**
 * Handles the wheel event to enable smooth horizontal scrolling of the container.
 *
 * @param {React.WheelEvent<HTMLDivElement>} e - The wheel event triggered on the scrollable container.
 * This event provides information about the scrolling direction and distance.
 * 
 * @returns {void} - This function does not return a value.
 */
const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
  const container = scrollRef.current;

  if (container) {
    const containerScrollPosition = container.scrollLeft;
    
    let scrollAmount = e.deltaY * 0.5; // Default for normal mice

    if (e.deltaMode === 1 || e.deltaY > 100) {
      // Handle hyper scroll or fast-scrolling devices
      scrollAmount = e.deltaY * 0.2; // Slow down for hyper scroll
    }

    container.scrollTo({
      top: 0,
      left: containerScrollPosition + scrollAmount,
      behavior: 'auto', // Use 'auto' to avoid jitter on hyper scroll
    });
  }
}, []);

  /**
   * A loading view component that shows shimmer loading rows.
   * 
   * @constant {JSX.Element} getLoadingView
   */
  const getLoadingView = (
    <>
      <div className="cometchat-sticker-keyboard__shimmer-tabs" >
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="cometchat-sticker-keyboard__shimmer-tab"
          />
        ))}
      </div>
      <div className="cometchat-sticker-keyboard__list cometchat-sticker-keyboard__shimmer-list">
        {Array.from({ length: 3 }).map((_) => (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="cometchat-sticker-keyboard__list-item cometchat-sticker-keyboard__shimmer-list-item"
                  />
                ))
              
        ))}
      </div>
    </>
  )

  /**
   * An empty view component that displays a message when there are no stickers available.
   * 
   * @constant {JSX.Element} getEmptyView
   */
  const getEmptyView = (
    <div className="cometchat-sticker-keyboard__empty-view">
      <div className="cometchat-sticker-keyboard__empty-view-icon" />
      {emptyStateText}
    </div>
  )

  /**
   * An error view component that displays a message when there is an error loading stickers.
   * 
   * @constant {JSX.Element} getErrorView
   */
  const getErrorView = (
    <div className="cometchat-sticker-keyboard__error-view">
      {errorStateText}
    </div>
  )

  /**
   * Returns the appropriate view based on the current state (loading, empty, or error).
   * 
   * @function getStateView
   * @returns {JSX.Element | null} The JSX element to display for the current state, or null if the state is loaded.
   */
  const getStateView = () => {
    switch (state) {
      case States.loading:
        return getLoadingView;
      case States.empty:
        return getEmptyView;
      case States.error:
        return getErrorView
      default:
        return null;
    }
  };

  return (
    <div className="cometchat" style={{
      height: "100%",
      width: "100%"
    }}>
      <div className="cometchat-sticker-keyboard">
        {state !== States.loaded &&
          <>
            {getStateView()}
          </>
        }

        {
          state === States.loaded &&
          <>
            <div className="cometchat-sticker-keyboard__tabs"   
            ref={scrollRef} 
            onWheel={onWheel}
            >
{
  categoryStickerUrl.map((sticker, index) => (
    <React.Fragment key={sticker.stickerSetName || `sticker-tab-${index}`}>
      <div
        className={`cometchat-sticker-keyboard__tab ${
          activeTab === sticker.stickerSetName
            ? "cometchat-sticker-keyboard__tab-active"
            : ""
        }`}
      >
        {sticker.stickerUrl && (
          <img
            onClick={() => stickerSetClicked(sticker.stickerSetName)}
            src={sticker.stickerUrl}
          />
        )}
      </div>
    </React.Fragment>
  ))
}

            </div>
            <div className="cometchat-sticker-keyboard__list">
            {
  activeStickerList.map((sticker, index) => (
    <div
      key={sticker.stickerUrl || `sticker-item-${index}`}
      onClick={() => sendStickerMessage(sticker)}
    >
      <img
        src={sticker.stickerUrl}
        alt={sticker.stickerSetName}
        className="cometchat-sticker-keyboard__list-item"
      />
    </div>
  ))
}

            </div>
          </>
        }
      </div>
    </div>
  );
};

export { StickersKeyboard };