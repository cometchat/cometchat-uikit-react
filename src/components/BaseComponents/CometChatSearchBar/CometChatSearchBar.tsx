import { useId } from "react";
import { useCometChatSearchBar } from "./useCometChatSearchBar";
import {getLocalizedString} from "../../../resources/CometChatLocalize/cometchat-localize";


interface SearchBarProps {
    /* default value of search input. */
    searchText?: string;
    /* placeholder text of the input. */
    placeholderText?: string;
    /* callback which is triggered after value of the input is changed. */
    onChange?: (input: { value?: string }) => void;
    /** Accessible label for the search input */
    ariaLabel?: string;
}

/*
    CometChatSearchBar is a generic component used for searching.
    It is generally used for searching users. It accepts searchText, which is the default value for the input, and placeholderText, which is a custom placeholder text for the input.
    It also accepts onChange, which is a custom callback triggered when the search input value changes.
*/
const CometChatSearchBar = (props: SearchBarProps) => {
    const {
        searchText = "",
        placeholderText = getLocalizedString("search_placeholder"),
        onChange = ({ value = "" }) => { },
        ariaLabel,
    } = props;

    const { searchValue, onInputChange } = useCometChatSearchBar({ searchText, onChange });
    const searchId = useId();

    return (
        <div className="cometchat" style={{
            height: "inherit",
            width: "inherit"
        }}>
            <div className="cometchat-search-bar" role="search">
                <div className="cometchat-search-bar__icon" aria-hidden="true"></div>
                <label htmlFor={searchId} className="cometchat-visually-hidden">
                    {ariaLabel || placeholderText || "Search"}
                </label>
                <input
                    id={searchId}
                    type="search"
                    className="cometchat-search-bar__input"
                    onChange={onInputChange}
                    placeholder={placeholderText}
                    value={searchValue}
                    aria-label={ariaLabel || placeholderText || "Search"}
                />
            </div>
        </div>
    )
}

export { CometChatSearchBar };
