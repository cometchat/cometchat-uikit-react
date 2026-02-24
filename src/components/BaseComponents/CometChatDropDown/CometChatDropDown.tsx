import { useId, useCallback, useRef, useEffect } from "react";
import { useCometChatDropDown } from "./useCometChatDropDown";
interface onOptionsChangedEvent {
    /** The value of the selected option from the dropdown. */
    value?: string;
}
interface DropDownProps {
    /** List of options to be displayed in the dropdown. */
    options: string[];
    /** Value from the list to be selected by default. */
    selectedOption?: string;
    /** Callback invoked when the dropdown selection changes. */
    onOptionsChanged?: (input: onOptionsChangedEvent) => void;
    /** Accessible label for the dropdown */
    ariaLabel?: string;
}

/*
    CometChatDropDown is a generic component which can be used as a dropdown with custom options list.
    It accepts "options" prop which is an array of strings and "selectedOption"(optional) for the default selected value.
    It also accepts 'onOptionsChanged' which is a callback function that triggers when the dropdown options change.
*/
const CometChatDropDown = (props: DropDownProps) => {
    const {
        options = [],
        selectedOption = options[0],
        onOptionsChanged = ({ value: string = "" }) => { },
        ariaLabel,
    } = props;

    const {
        dropdownVisible,
        selectedOptionState,
        onButtonClick,
        onOptionClick
    } = useCometChatDropDown({ selectedOption, onOptionsChanged });

    const dropdownId = useId();
    const listboxId = `${dropdownId}-listbox`;
    const listRef = useRef<HTMLDivElement>(null);
    const focusedIndexRef = useRef<number>(-1);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (!dropdownVisible) {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                event.preventDefault();
                onButtonClick();
            }
            return;
        }

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                onButtonClick();
                break;
            case 'ArrowDown':
                event.preventDefault();
                focusedIndexRef.current = Math.min(focusedIndexRef.current + 1, options.length - 1);
                focusOption(focusedIndexRef.current);
                break;
            case 'ArrowUp':
                event.preventDefault();
                focusedIndexRef.current = Math.max(focusedIndexRef.current - 1, 0);
                focusOption(focusedIndexRef.current);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (focusedIndexRef.current >= 0 && focusedIndexRef.current < options.length) {
                    onOptionClick(options[focusedIndexRef.current]);
                }
                break;
            case 'Home':
                event.preventDefault();
                focusedIndexRef.current = 0;
                focusOption(0);
                break;
            case 'End':
                event.preventDefault();
                focusedIndexRef.current = options.length - 1;
                focusOption(options.length - 1);
                break;
        }
    }, [dropdownVisible, options, onButtonClick, onOptionClick]);

    const focusOption = (index: number) => {
        const items = listRef.current?.querySelectorAll('[role="option"]');
        if (items && items[index]) {
            (items[index] as HTMLElement).focus();
        }
    };

    useEffect(() => {
        if (dropdownVisible) {
            focusedIndexRef.current = options.indexOf(selectedOptionState);
            if (focusedIndexRef.current === -1) focusedIndexRef.current = 0;
            setTimeout(() => focusOption(focusedIndexRef.current), 0);
        }
    }, [dropdownVisible]);

    return (
        <div className="cometchat">
            <div className="cometchat-dropdown" onKeyDown={handleKeyDown}>
                <button
                    type="button"
                    name="button"
                    className="cometchat-dropdown__placeholder-text"
                    onClick={onButtonClick}
                    aria-haspopup="listbox"
                    aria-expanded={dropdownVisible}
                    aria-controls={listboxId}
                    aria-label={ariaLabel || `Select option, current: ${selectedOptionState}`}
                >
                    <span title={selectedOptionState}>{selectedOptionState}</span>
                    <div
                        className="cometchat-dropdown__arrow"
                        aria-hidden="true"
                    />
                </button >
                <div
                    ref={listRef}
                    id={listboxId}
                    role="listbox"
                    aria-label={ariaLabel || "Options"}
                    className={dropdownVisible ? "cometchat-dropdown__items" : "cometchat-dropdown__items-hidden"}
                >
                    {options.map((option: string, index: number) => (
                        <div
                            key={index}
                            role="option"
                            tabIndex={dropdownVisible ? 0 : -1}
                            aria-selected={selectedOptionState === option}
                            className="cometchat-dropdown__item"
                            onClick={() => {
                                onOptionClick(option);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onOptionClick(option);
                                }
                            }}
                        >
                            <span className="cometchat-dropdown__item-label" title={option}>{option}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export { CometChatDropDown };