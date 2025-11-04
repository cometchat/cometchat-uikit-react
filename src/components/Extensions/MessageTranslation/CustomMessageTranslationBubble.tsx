import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MentionsTargetElement, MessageBubbleAlignment } from "../../../Enums/Enums";
import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
import { getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";
import TranslateIcon from "../../../assets/translate.svg";
import { ICustomTranslateLanguage } from "../../../events/CometChatMessageEvents";
import { useCometChatFrameContext } from "../../../context/CometChatFrameContext";
import { CometChatPopover, Placement } from "../../BaseComponents/CometChatPopover/CometChatPopover";

interface CustomMessageTranslationBubbleProps {
  translatedText: string;
  alignment: MessageBubbleAlignment;
  textFormatters?: Array<CometChatTextFormatter>;
  children?: ReactNode;
  isSentByMe?: boolean;
  helperText?: string;
  selectedLanguage: ICustomTranslateLanguage;
  languages: ICustomTranslateLanguage[];
  onLanguageChange: (language: ICustomTranslateLanguage) => void;
  isLoading?: boolean;
}

const defaultProps: Partial<CustomMessageTranslationBubbleProps> = {
  translatedText: "",
  alignment: MessageBubbleAlignment.right,
  helperText: getLocalizedString("message_text_translated_to"),
  textFormatters: [],
  isSentByMe: true,
  languages: [],
  isLoading: false,
};

const CustomMessageTranslationBubble = (
  props: CustomMessageTranslationBubbleProps
) => {
  const {
    children,
    helperText,
    translatedText,
    alignment,
    textFormatters,
    isSentByMe,
    selectedLanguage,
    languages,
    onLanguageChange,
    isLoading,
  } = { ...defaultProps, ...props };

  const textElementRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<{
    openPopover: () => void;
    closePopover: () => void;
  } | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const IframeContext = useCometChatFrameContext();

  const availableLanguages = useMemo(
    () => languages ?? [],
    [languages]
  );

  const selectedLanguageSafe = useMemo(() => {
    if (!selectedLanguage) {
      return { code: "", name: "" };
    }
    return selectedLanguage;
  }, [selectedLanguage]);

  const getCurrentDocument = () => {
    return IframeContext?.iframeDocument || document;
  };

  const filteredLanguages = useMemo(() => {
    if (!searchTerm.trim()) {
      return availableLanguages;
    }
    const lower = searchTerm.trim().toLowerCase();
    return availableLanguages.filter((language) =>
      (language.name || language.code).toLowerCase().includes(lower)
    );
  }, [availableLanguages, searchTerm]);

  useEffect(() => {
    if (!textFormatters) {
      return;
    }

    const textElement = textElementRef.current;
    let finalText: string | void = translatedText;

    if (textFormatters && textFormatters.length) {
      textFormatters.forEach((formatter: CometChatTextFormatter) => {
        finalText = formatter.getFormattedText(finalText!, {
          mentionsTargetElement: MentionsTargetElement.textbubble,
        });
      });
    }
    if (textElement) {
      textElement.textContent = "";
      pasteHtml(textElement, finalText || "");
    }
  }, [textFormatters, translatedText]);

  const toggleDropdown = useCallback(() => {
    if (!availableLanguages.length) {
      return;
    }
    if (isPopoverOpen) {
      popoverRef.current?.closePopover();
      setIsPopoverOpen(false);
      setSearchTerm("");
    } else {
      setSearchTerm("");
      popoverRef.current?.openPopover();
      setIsPopoverOpen(true);
    }
  }, [availableLanguages.length, isPopoverOpen]);

  const handleLanguageSelection = useCallback(
    (language: ICustomTranslateLanguage) => {
      if (
        !language ||
        !language.code ||
        language.code === selectedLanguageSafe.code
      ) {
        popoverRef.current?.closePopover();
        setIsPopoverOpen(false);
        return;
      }
      onLanguageChange(language);
      setSearchTerm("");
      popoverRef.current?.closePopover();
      setIsPopoverOpen(false);
    },
    [onLanguageChange, selectedLanguageSafe.code]
  );

  function pasteHtml(textElement: HTMLDivElement, html: string) {
    try {
      const doc = getCurrentDocument();
      const el = doc.createElement("div");
      el.innerHTML = html;
      const frag = doc.createDocumentFragment();
      let node: ChildNode | null;
      while ((node = el.firstChild)) {
        if (node instanceof HTMLElement && textFormatters?.length) {
          let elementNode: HTMLElement = node;
          for (let i = 0; i < textFormatters.length; i++) {
            elementNode = textFormatters[i].registerEventListeners(
              elementNode,
              elementNode.classList
            ) as HTMLElement;
          }
          frag.appendChild(elementNode);
        } else {
          frag.appendChild(node);
        }
      }
      textElement.appendChild(frag);
    } catch (error) {
      console.log(error);
    }
  }

  if (!translatedText?.trim().length) {
    return null;
  }

  return (
    <div className="cometchat">
      <div
        className={`cometchat-tanslation-bubble ${!isSentByMe
            ? "cometchat-tanslation-bubble-incoming"
            : "cometchat-tanslation-bubble-outgoing"
          }`}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <div className="cometchat-tanslation-bubble__original-text">
            {children}
          </div>
          <div className="cometchat-tanslation-bubble__separator" />
          <div
            ref={textElementRef}
            className="cometchat-tanslation-bubble__translated-text"
          />
        </div>
        <div className="cometchat-tanslation-bubble__helper-text">
          <div
          className={`cometchat-custom-translation__helper ${!isSentByMe
              ? "cometchat-custom-translation__helper-incoming"
              : "cometchat-custom-translation__helper-outgoing"
            }`}
        >
            <span
              className="cometchat-custom-translation__helper-icon"
              aria-hidden="true"
            >
              <img src={TranslateIcon} alt="" />
            </span>
            <span className="cometchat-custom-translation__helper-label">
              {helperText}
            </span>
            <CometChatPopover
              ref={popoverRef}
              placement={
                isSentByMe ? Placement.top : Placement.top
              }
              useParentContainer
              useParentHeight={false}
              closeOnOutsideClick
              onOutsideClick={() => {
                setIsPopoverOpen(false);
                setSearchTerm("");
              }}
              childClickHandler={(_openContent, event) => {
                event.preventDefault();
                toggleDropdown();
              }}
              content={
                <div className="cometchat-custom-translation__dropdown">
                  <div className="cometchat-custom-translation__search-wrapper">
                    <input
                      className="cometchat-custom-translation__search-input"
                      type="text"
                      placeholder={
                        getLocalizedString("message_list_language_search") ||
                        "Search language"
                      }
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                    />
                  </div>
                  <div className="cometchat-custom-translation__dropdown-list">
                    {filteredLanguages.length ? (
                      filteredLanguages.map((language) => {
                        const isSelected =
                          selectedLanguageSafe.code === language.code;
                        return (
                          <div
                            key={`${language.code}`}
                            role="option"
                            aria-selected={isSelected}
                            className={`cometchat-custom-translation__dropdown-item ${
                              isSelected
                                ? "cometchat-custom-translation__dropdown-item-selected"
                                : ""
                            }`}
                            onClick={() => handleLanguageSelection(language)}
                          >
                            {language.flagUrl ? (
                              <img
                                className="cometchat-custom-translation__dropdown-flag"
                                src={language.flagUrl}
                                alt={language.name || language.code}
                              />
                            ) : null}
                            <span className="cometchat-custom-translation__dropdown-label">
                              {language.name || language.code}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="cometchat-custom-translation__dropdown-empty">
                        {getLocalizedString("message_list_language_empty") ||
                          "No results"}
                      </div>
                    )}
                  </div>
                  {isLoading ? (
                    <span
                      className="cometchat-custom-translation__language-loader"
                      aria-label={
                        getLocalizedString("message_text_translating") ||
                        "Translating"
                      }
                    />
                  ) : null}
                </div>
              }
            >
              <button
                type="button"
                className="cometchat-custom-translation__language-trigger"
                aria-haspopup="listbox"
                aria-expanded={isPopoverOpen}
                disabled={!availableLanguages.length || isLoading}
              >
                <span className="cometchat-custom-translation__language-text">
                  {selectedLanguageSafe.name || selectedLanguageSafe.code || "-"}
                </span>
                <span
                  className={`cometchat-custom-translation__language-arrow ${
                    isPopoverOpen
                      ? "cometchat-custom-translation__language-arrow-open"
                      : ""
                  }`}
                />
              </button>
            </CometChatPopover>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CustomMessageTranslationBubble };
