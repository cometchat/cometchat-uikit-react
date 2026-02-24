import { useCallback, useEffect, useRef } from "react";
import { useCometChatEmojiKeyboard } from "./useCometChatEmojiKeyboard";
import { CometChatEmoji, CometChatEmojiCategory } from "./CometChatEmoji";
import { getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatSearchBar } from "../CometChatSearchBar/CometChatSearchBar";

interface EmojiKeyboardProps {
  /* Array of required emoji data to be shown in the keyboard as category wise. */
  emojiData?: CometChatEmojiCategory[];
  /* callback function which is triggered on any emoji click. */
  onEmojiClick?: (emoji: string) => void;
  panelType?: string;
}

/* 
    CometChatEmojiKeyboard is a generic component used for displaying a set of emojis. 
    It is generally used as a keyboard for sending emojis in chat. 
    It accepts emojiData, an array of emojis to be displayed, and onEmojiClick, a callback function triggered when any emoji is clicked.
*/
const CometChatEmojiKeyboard = (props: EmojiKeyboardProps) => {
  const { emojiData = [], onEmojiClick, panelType } = props;

  const {
    emojiDataState,
    activeCategory,
    setActiveCategory,
    searchEmojiData,
    searchString,
    getEmojiData,
    getEmojiCategory,
    scrollToElement,
    filterEmojis,
  } = useCometChatEmojiKeyboard({ emojiData });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const focusFirstEmoji = useCallback((categoryId: string) => {
    setTimeout(() => {
      const categoryElement = document.getElementById(categoryId);
      if (categoryElement) {
        const firstEmoji = categoryElement.nextElementSibling?.querySelector(
          ".cometchat-emoji-keyboard__list-item",
        ) as HTMLElement;
        firstEmoji?.focus({ preventScroll: true });
      }
    }, 150);
  }, []);

  useEffect(() => {
    getEmojiCategory();
  }, []);

  useEffect(() => {
    if (!activeCategory) {
      setActiveCategory(emojiDataState[0]?.id);
    }
  }, [emojiDataState]);

  const getEmojiListComponent = (emojiData: {
    [key: string]: CometChatEmoji;
  }) => {
    return (
      <div
        className={
          panelType === "mobile"
            ? "cometchat-emoji-keyboard__emoji-list_mobile_app"
            : "cometchat-emoji-keyboard__emoji-list"
        }
        role='grid'
        aria-label='Emoji list'
      >
        {Object.keys(emojiData).map((item: string, index: number) => (
          <div
            key={item + index}
            className='cometchat-emoji-keyboard__list-item'
            title={item}
            role='button'
            tabIndex={0}
            aria-label={item}
            onClick={() => {
              onEmojiClick?.(emojiData[item].char);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEmojiClick?.(emojiData[item].char);
              }
            }}
          >
            {getEmojiData(emojiData[item])}
          </div>
        ))}
      </div>
    );
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
        behavior: "auto", // Use 'auto' to avoid jitter on hyper scroll
      });
    }
  }, []);

  return (
    <div
      className='cometchat'
      style={{
        height: "inherit",
        width: "inherit",
      }}
    >
      <div className='cometchat-emoji-keyboard'>
        <div
          className='cometchat-emoji-keyboard__tabs'
          ref={scrollRef}
          onWheel={onWheel}
          role='tablist'
          aria-label='Emoji categories'
        >
          {emojiDataState.map(
            (emoji: CometChatEmojiCategory, counter: number) => (
              <div
                key={counter + emoji.id}
                onClick={() => {
                  scrollToElement(emoji.id);
                  focusFirstEmoji(emoji.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    scrollToElement(emoji.id);
                    focusFirstEmoji(emoji.id);
                  }
                }}
                title={getLocalizedString(emoji.name)}
                role='tab'
                tabIndex={0}
                aria-selected={activeCategory === emoji.id}
                aria-label={getLocalizedString(emoji.name)}
                className={
                  activeCategory == emoji.id
                    ? "cometchat-emoji-keyboard__tab-active cometchat-emoji-keyboard__tab"
                    : "cometchat-emoji-keyboard__tab"
                }
              >
                <div title={getLocalizedString(emoji.name)}>
                  <div
                    style={
                      emoji.symbolURL
                        ? {
                            WebkitMask: `url(${emoji.symbolURL}) center center no-repeat`,
                          }
                        : undefined
                    }
                    className={`cometchat-emoji-keyboard__tab-icon`}
                  />
                </div>
              </div>
            ),
          )}
        </div>
        <div className='cometchat-emoji-keyboard__search'>
          <CometChatSearchBar
            placeholderText={getLocalizedString("emoji_search_placeholder")}
            onChange={filterEmojis}
            searchText={searchString}
          />
        </div>
        {Object.keys(searchEmojiData).length > 0 ? (
          <div className='cometchat-emoji-keyboard__list'>
            {getEmojiListComponent(searchEmojiData)}
          </div>
        ) : (
          <div
            className='cometchat-emoji-keyboard__list'
            role='region'
            aria-label='Emoji categories'
          >
            {emojiDataState.map((emoji: CometChatEmojiCategory) => (
              <div
                className='cometchat-emoji-keyboard__list-content'
                key={emoji.id}
                role='group'
                aria-labelledby={`emoji-category-${emoji.id}`}
              >
                <div
                  className='cometchat-emoji-keyboard__list-title'
                  id={emoji.id}
                  role='heading'
                  aria-level={2}
                >
                  <div
                    title={getLocalizedString(emoji.name)}
                    id={`emoji-category-${emoji.id}`}
                  >
                    {getLocalizedString(emoji.name)}
                  </div>
                </div>
                {getEmojiListComponent(emoji.emojies)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { CometChatEmojiKeyboard };
