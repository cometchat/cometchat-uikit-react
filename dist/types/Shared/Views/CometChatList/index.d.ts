import "@cometchat/uikit-elements";
import { CometChatTheme, States, TitleAlignment } from "@cometchat/uikit-resources";
import { JSX } from "react";
import { ListStyle } from "@cometchat/uikit-shared";
export type DivElementRef = HTMLDivElement | null;
interface IListProps<T> {
    /**
     * Title of the component
     *
     * @defaultValue `""`
     */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Hide the search bar
     *
     * @defaulValue `false`
     */
    hideSearch?: boolean;
    /**
     * Text to fill the search input with
     *
     * @defaultValue `""`
     */
    searchText?: string;
    /**
     * Function to call when the search input text changes
     *
     * @remarks
     * This function will only be called after 500ms of the search input text change
     */
    onSearch?: (searchStr: string) => void;
    /**
     * Image URL for the search icon to use in the search bar
     */
    searchIconURL?: string;
    /**
     * Text to be displayed when the search input has no value
     *
     * @defaultValue `"Search"`
     */
    searchPlaceholderText?: string;
    /**
     * List of objects to display
     */
    list: T[];
    /**
     * Custom list item view to be rendered for each object in the `list` prop
     */
    listItem: (item: T, itemIndex: number) => JSX.Element;
    /**
     * Function to call when the scrollbar is at the top-most position of the scrollable list
     */
    onScrolledToBottom?: () => Promise<any>;
    /**
     * Function to call when the scrollbar is at the bottom-most position of the scrollable list
     */
    onScrolledToTop?: () => Promise<any>;
    /**
     * Function to call when the scrollbar is not at the bottom-most position of the scrollable list
     */
    scrolledUpCallback?: (boolean?: boolean) => void;
    /**
     * Show alphabetical header
     *
     * @defaultValue `true`
     */
    showSectionHeader?: boolean;
    /**
     * Property on each object in the `list` prop
     *
     * @remarks
     * This property will be used to extract the section header character from each object in the `list` prop
     */
    sectionHeaderKey?: keyof T;
    /**
     * Property on each object in the `list` prop
     *
     * @remarks
     * This property will be used to extract the key value from each object in the `list` prop. The extracted key value is set as a `key` of a React element
     */
    listItemKey: keyof T;
    /**
     * Fetch state of the component
     */
    state: States;
    /**
     * Custom view for the loading state of the component
     */
    loadingView?: JSX.Element;
    /**
     * Image URL for the default loading view
     */
    loadingIconURL?: string;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `"ERROR"`
     */
    errorStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `"EMPTY"`
     */
    emptyStateText?: string;
    /**
     * Set the scrollbar to the bottom-most position of the scrollable list
     *
     * @remarks
     * If the scrollbar of the scrollable list is set to the bottom-most position of the scrollable list because of this `prop`, the component won't call the `onScrolledToBottom` prop
     */
    scrollToBottom?: boolean;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
    /**
     * Styles to apply to this component
     */
    listStyle?: ListStyle;
    theme?: CometChatTheme;
}
declare function List<T>(props: IListProps<T>): JSX.Element;
/**
 * Renders a scrollable list
 */
export declare const CometChatList: typeof List;
export {};
