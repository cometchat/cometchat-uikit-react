import React, { useRef, JSX } from "react";
import "my-cstom-package-lit";
import { States, TitleAlignment, ListStyle } from "uikit-utils-lerna";
import { CometChatTheme } from "uikit-resources-lerna";
import { Hooks } from "./hooks";
import { emptyLabelStyle, errorLabelStyle, headerStyle, listItemContainerStyle, listWrapperStyle, loaderStyle, sectionHeaderStyle, titleStyle, searchInputStyle, viewContainerStyle, defaultViewStyle, customViewStyle, intersectionObserverBottomTargetDivStyle } from "./style";
import { CometChat } from "@cometchat-pro/chat";
import { useCometChatErrorHandler, useRefSync, useStateRef } from "../../../CometChatCustomHooks";

/**
 * Extracts the value associated with the passed key from the passed object
 * 
 * @param key - Property on the `item` parameter
 * @param item - Any object
 * @returns String converted value associated with the `key` property of the `item`  object
 */
function getKeyValue<T>(key : keyof T, item : T) : string {
    let res : string;

    const keyValue = item[key];
    if (typeof keyValue === "function") {
        res = String(keyValue.call(item));
    }
    else {
        res = String(keyValue);
    }

    return res;
}

export type DivElementRef = HTMLDivElement | null;

interface IListProps<T> {
    /** 
     * Title of the component 
     * 
     * @defaultValue `""` 
    */
    title? : string,
    /**
     * Alignment of the `title` text
     * 
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment? : TitleAlignment,
    /**
     * Hide the search bar
     * 
     * @defaulValue `false`
     */
    hideSearch? : boolean,
    /**
     * Text to fill the search input with
     * 
     * @defaultValue `""`
     */
    searchText? : string,
    /**
     * Function to call when the search input text changes
     * 
     * @remarks
     * This function will only be called after 500ms of the search input text change
     */
    onSearch? : (searchStr : string) => void,
    /**
     * Image URL for the search icon to use in the search bar
     */
    searchIconURL? : string,
    /**
     * Text to be displayed when the search input has no value
     * 
     * @defaultValue `"Search"`
     */
    searchPlaceholderText? : string,
    /**
     * List of objects to display
     */
    list : T[],
    /**
     * Custom list item view to be rendered for each object in the `list` prop
     */
    listItem : (item : T, itemIndex : number) => JSX.Element,
    /**
     * Function to call when the scrollbar is at the top-most position of the scrollable list
     */
    onScrolledToBottom? : () => Promise<any>,
    /**
     * Function to call when the scrollbar is at the bottom-most position of the scrollable list
     */
    onScrolledToTop? : () => Promise<any>,
    /**
     * Show alphabetical header
     * 
     * @defaultValue `true`
     */
    showSectionHeader? : boolean,
    /**
     * Property on each object in the `list` prop
     * 
     * @remarks
     * This property will be used to extract the section header character from each object in the `list` prop 
     */
    sectionHeaderKey? : keyof T,
    /**
     * Property on each object in the `list` prop
     * 
     * @remarks 
     * This property will be used to extract the key value from each object in the `list` prop. The extracted key value is set as a `key` of a React element
     */
    listItemKey : keyof T,
    /**
     * Fetch state of the component
     */
    state : States,
    /**
     * Custom view for the loading state of the component
     */
    loadingView? : JSX.Element,
    /**
     * Image URL for the default loading view
     */
    loadingIconURL? : string,
    /**
     * Hide error view
     * 
     * @remarks
     * If set to true, hides the default and the custom error view
     * 
     * @defaultValue `false`
     */
    hideError? : boolean,
    /**
     * Custom view for the error state of the component
     */
    errorStateView? : JSX.Element,
    /**
     * Text to display in the default error view
     * 
     * @defaultValue `"ERROR"`
     */
    errorStateText? : string,
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView? : JSX.Element,
    /**
     * Text to display in the default empty view
     * 
     * @defaultValue `"EMPTY"`
     */
    emptyStateText? : string,
    /**
     * Set the scrollbar to the bottom-most position of the scrollable list
     * 
     * @remarks
     * If the scrollbar of the scrollable list is set to the bottom-most position of the scrollable list because of this `prop`, the component won't call the `onScrolledToBottom` prop
     */
    scrollToBottom? : boolean,
    /**
     * Function to call whenever the component encounters an error
     */
    onError? : (error : CometChat.CometChatException) => void,
    /**
     * Styles to apply to this component
     */
    listStyle? : ListStyle,
    // Won't add tsdoc comment here as this will be removed
    theme? : CometChatTheme
};

function List<T>(props : IListProps<T>) : JSX.Element {
    const {
        title = "",
        titleAlignment = TitleAlignment.left,
        hideSearch = false,
        searchText = "",
        onSearch,
        searchIconURL,
        searchPlaceholderText = "Search",
        list,
        listItem,
        showSectionHeader = true,
        sectionHeaderKey,
        listItemKey,
        onScrolledToBottom,
        onScrolledToTop,
        state,
        loadingView,
        loadingIconURL,
        hideError = false,
        errorStateView,
        errorStateText = "Error",
        emptyStateView,
        emptyStateText = "Empty",
        scrollToBottom = false,
        onError,
        listStyle = null
    } = props;

    const [searchInputElement, setSearchInputRef] = useStateRef<JSX.IntrinsicElements["cometchat-search-input"] | null>(null);
    const intersectionObserverRootRef = useRef<DivElementRef>(null);
    const intersectionObserverTopTargetRef = useRef<DivElementRef>(null);
    const intersectionObserverBottomTargetRef = useRef<DivElementRef>(null);
    const didComponentScrollToBottomRef = useRef(false);
    const timeoutIdRef = useRef<number | null>(null);
    const scrollHeightTupleRef = useRef<[number, number]>([0, 0]);
    const didTopObserverCallbackRunRef = useRef(false);
    const onScrolledToTopRef = useRefSync(onScrolledToTop);
    const onScrolledToBottomRef = useRefSync(onScrolledToBottom);
    const onSearchRef = useRefSync(onSearch);
    const errorHandler = useCometChatErrorHandler(onError);

    /**
     * Creates the title view
     */
    function getTitle() : JSX.Element {
        return (
            <div
                className = "cc-list__title"
                style = {titleStyle(listStyle, titleAlignment)}
            >
                {title}
            </div>
        );
    }

    /**
     * Creates the search box
     */
    function getSearchBox() : JSX.Element | null {
        if (hideSearch) {
            return null;
        }
        return (
            <cometchat-search-input
                ref = {setSearchInputRef}
                searchText = {searchText}
                placeholderText = {searchPlaceholderText}
                searchInputStyle = {JSON.stringify(searchInputStyle(listStyle))}
                searchIconURL = {searchIconURL}
            />
        );
    }

    /**
     * Creates a list of views using the objects from the `list` prop
     */
    function getList() : JSX.Element[] | null {
        if ((state === States.loading && list.length === 0) || state === States.empty || state === States.error) {
            return null;
        }
        let currrentSectionHeader = "";
        return list.map((item, itemIdx) => {
            let listSectionJSX : JSX.Element | null = null;
            if (showSectionHeader) {
                let itemSectionHeader : string;
                if (sectionHeaderKey === undefined) {
                    errorHandler(new CometChat.CometChatException({
                        code: "ERROR",
                        name: "Error",
                        message: "'sectionHeaderKey' prop must be provided when 'showSectionHeader' prop is set to true. 'showSectionHeader' is set to be true by default"
                    }));
                    itemSectionHeader = " ";
                }
                else {
                    itemSectionHeader = (getKeyValue(sectionHeaderKey, item) || " ")[0].toUpperCase();
                }
                let sectionHeaderJSX : JSX.Element | null = null;
                if (itemIdx === 0) {
                    sectionHeaderJSX = (
                        <div
                            className = "cc-list__section-header"
                            style = {sectionHeaderStyle(listStyle)}
                        >
                            {itemSectionHeader}
                        </div>
                    );
                    currrentSectionHeader = itemSectionHeader;
                }
                else if (currrentSectionHeader !== itemSectionHeader) {
                    sectionHeaderJSX = (
                        <div 
                            className = "cc-list__section-separator"
                        >
                            <div
                                className = "cc-list__section-header"
                                style = {sectionHeaderStyle(listStyle)}
                            >
                                {itemSectionHeader}
                            </div>
                        </div>
                    );
                    currrentSectionHeader = itemSectionHeader;
                }
                else {
                    sectionHeaderJSX = (
                        <div 
                            className = "cc-list__section-separator"
                        >
                        </div>
                    );
                }   
                listSectionJSX = (
                    <div 
                        className = "cc-list__section"
                    >
                        {sectionHeaderJSX}
                    </div>
                );
            }
            return (
                <div
                    key = {getKeyValue(listItemKey, item)}
                    className = "cc-list__item"
                >
                    {listSectionJSX}
                    {listItem(item, itemIdx)}       
                </div>
            );
        });
    }

    /**
     * Creates the loading view
     */
    function getLoadingView() : JSX.Element {
        let loadingViewJSX : JSX.Element;
        if (!loadingView) {
            loadingViewJSX = (
                <div
                    className = "cc-list__loading-view cc-list__loading-view--default"
                    style = {defaultViewStyle()}
                >
                    <cometchat-loader 
                        iconURL = {loadingIconURL}
                        loaderStyle = {JSON.stringify(loaderStyle(listStyle))}
                    />
                </div>
            );
        }
        else {
            loadingViewJSX = (
                <div
                    style = {customViewStyle()}
                    className = "cc-list__loading-view cc-list__loading-view--custom"
                >
                    {loadingView}
                </div>
            );
        }
        return (
            <div
                className = "cc-list__loading-view-wrapper"
                style = {viewContainerStyle()}
            >   
                {loadingViewJSX}
            </div>
        );
    }

    /**
     * Creates the error view
     */
    function getErrorView() : JSX.Element | null {
        if (hideError) {
            return null;
        }
        let errorViewJSX : JSX.Element;
        if (!errorStateView) {
            errorViewJSX = (
                <div
                    style = {defaultViewStyle()}
                    className = "cc-list__error-view cc-list__error-view--default"
                >
                    <cometchat-label 
                        text = {errorStateText}
                        labelStyle = {JSON.stringify(errorLabelStyle(listStyle))}
                    />
                </div>
            );
        }
        else {
            errorViewJSX = (
                <div
                    style = {customViewStyle()}
                    className = "cc-list__error-view cc-list__error-view--custom"
                >
                    {errorStateView}
                </div>
            );
        }
        return (
            <div
                className = "cc-list__error-view-wrapper"
                style = {viewContainerStyle()}
            >
                {errorViewJSX}
            </div>
        );
    }

    /**
     * Creates the empty view
     */
    function getEmptyView() : JSX.Element {
        let emptyViewJSX : JSX.Element;
        if (!emptyStateView) {
            emptyViewJSX = (
                <div
                    style = {defaultViewStyle()}
                    className = "cc-list__empty-view cc-list__empty-view--default"
                >
                    <cometchat-label 
                        text = {emptyStateText}
                        labelStyle = {JSON.stringify(emptyLabelStyle(listStyle))}
                    />
                </div>
            );
        }
        else {
            emptyViewJSX = (
                <div
                    style = {customViewStyle()}
                    className = "cc-list__empty-view cc-list__empty-view--custom"
                >
                    {emptyStateView}
                </div>
            );
        }
        return (
            <div
                className = "cc-list__empty-view-wrapper"
                style = {viewContainerStyle()}
            >
                {emptyViewJSX}
            </div>
        );
    }

    /**
     * Creates a view based on the value of the `state` prop
     */
    function getStateView() : JSX.Element | null {
        let res : JSX.Element | null = null;
        switch(state) {
            case States.loading: 
                if (list.length === 0) {
                    res = getLoadingView();
                }
                break;
            case States.error:
                res = getErrorView();
                break;
            case States.empty:
                res = getEmptyView();
                break;
            case States.loaded:
                break;
            default: 
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const x : never = state;
        }
        return res;
    }

    Hooks({
        onSearchRef,
        searchInputElement,
        intersectionObserverRootRef,
        intersectionObserverBottomTargetRef,
        onScrolledToBottomRef,
        onScrolledToTopRef,
        intersectionObserverTopTargetRef,
        timeoutIdRef,
        scrollToBottom,
        didComponentScrollToBottomRef,
        scrollHeightTupleRef,
        didTopObserverCallbackRunRef,
        errorHandler
    });

    return (
        <div
            className = "cc-list"
            style = {listWrapperStyle(listStyle)}
        >
            <div
                className = "cc-list__header"
                style = {headerStyle()}
            >
                {getTitle()}
                {getSearchBox()}
            </div>
            <div
                ref = {intersectionObserverRootRef}
                className = "cc-list__content"
                style = {listItemContainerStyle()}
            >
                <div
                    ref = {intersectionObserverTopTargetRef}
                >
                </div>
                {getList()}
                {getStateView()}
                <div
                    ref = {intersectionObserverBottomTargetRef}
                    style = {intersectionObserverBottomTargetDivStyle()}
                >
                </div>
            </div>
        </div>
    );
}

const genericMemo: <T>(component: T) => T = React.memo;
/**
 * Renders a scrollable list
 */
export const CometChatList = genericMemo(List);
