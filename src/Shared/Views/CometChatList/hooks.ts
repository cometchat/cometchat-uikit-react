import React, { useEffect, JSX } from "react";
import { DivElementRef } from ".";

type Args = {
    onSearchRef : React.MutableRefObject<((searchStr : string) => void) | undefined>,
    searchInputElement : JSX.IntrinsicElements["cometchat-search-input"] | null,
    intersectionObserverRootRef : React.MutableRefObject<DivElementRef>,
    intersectionObserverBottomTargetRef : React.MutableRefObject<DivElementRef>,
    intersectionObserverTopTargetRef : React.MutableRefObject<DivElementRef>,
    onScrolledToBottomRef : React.MutableRefObject<(() => void) | undefined>,
    onScrolledToTopRef : React.MutableRefObject<(() => void) | undefined>,
    timeoutIdRef : React.MutableRefObject<number | null>,
    scrollToBottom : boolean,
    didComponentScrollToBottomRef : React.MutableRefObject<boolean>,
    scrollHeightTupleRef : React.MutableRefObject<[number, number]>,
    didTopObserverCallbackRunRef : React.MutableRefObject<boolean>,
    errorHandler : (error : unknown) => void 
};

export function Hooks(args : Args) {
    const {
        onSearchRef,
        searchInputElement,
        intersectionObserverRootRef,
        intersectionObserverBottomTargetRef,
        intersectionObserverTopTargetRef,
        onScrolledToBottomRef,
        onScrolledToTopRef,
        timeoutIdRef,
        scrollToBottom,
        didComponentScrollToBottomRef,
        scrollHeightTupleRef,
        didTopObserverCallbackRunRef,
        errorHandler
    } = args;

    useEffect(
        /**
         * Attaches search changed event listener on the search input element
         */
        () => {
            if (!searchInputElement) {
                return;
            }
            function handleSearchChanged(e : CustomEvent) {
                const newSearchText = e.detail.searchText;
                if (timeoutIdRef.current !== null) {
                    window.clearTimeout(timeoutIdRef.current);
                }
                timeoutIdRef.current = window.setTimeout(() => {
                    onSearchRef.current?.(newSearchText);
                    timeoutIdRef.current = null;
                }, 500);
            }
            const eventName = "cc-search-changed";
            searchInputElement.addEventListener(eventName, handleSearchChanged);
            return () => {
                searchInputElement.removeEventListener(eventName, handleSearchChanged);
            };
    }, [searchInputElement, onSearchRef, timeoutIdRef]);

    useEffect(
        /**
         * Creates an observer and sets it to observe a dummy element that is the bottom-most child of the scrollable list
         */
        () => {
            if (!intersectionObserverRootRef.current || !intersectionObserverBottomTargetRef.current) {
                return;
            }
            let stopCallingOnScrolledToBottomCallback = false;
            const rootElement = intersectionObserverRootRef.current;
            const targetElement = intersectionObserverBottomTargetRef.current;
            async function observerCallBack(entry : IntersectionObserverEntry[]) {
                const relevantEntry = entry[0];
                if (didComponentScrollToBottomRef.current && relevantEntry.isIntersecting) {
                    didComponentScrollToBottomRef.current = false;
                    return;
                }
                if (!relevantEntry.isIntersecting || stopCallingOnScrolledToBottomCallback || rootElement.scrollHeight <= rootElement.clientHeight) {
                    return;
                }
                stopCallingOnScrolledToBottomCallback = true;
                try {
                    await Promise.all([onScrolledToBottomRef.current?.()]);
                }
                catch(error) {
                    errorHandler(error);
                }
                stopCallingOnScrolledToBottomCallback = false;
            }
            const options = {root: rootElement, threshold: 0.1};
            const observer = new IntersectionObserver(observerCallBack, options);
            observer.observe(targetElement);
            return () => {
                observer.unobserve(targetElement);
            };
    }, [errorHandler, didComponentScrollToBottomRef, intersectionObserverBottomTargetRef, intersectionObserverRootRef, onScrolledToBottomRef]);

    useEffect(
        /**
         * Creates an observer and sets it to observe a dummy element that the top-most child of the scrollable list
         */
        () => {
            if (!intersectionObserverRootRef.current || !intersectionObserverTopTargetRef.current) {
                return;
            }
            let stopCallingOnScrolledToTopCallback = false;
            const rootElement = intersectionObserverRootRef.current;
            const targetElement = intersectionObserverTopTargetRef.current;
            async function observerCallBack(entry : IntersectionObserverEntry[]) {
                const relevantEntry = entry[0];
                if (!relevantEntry.isIntersecting || stopCallingOnScrolledToTopCallback || rootElement.scrollHeight <= rootElement.clientHeight) {
                    return;
                }
                stopCallingOnScrolledToTopCallback = true;
                try {
                    await Promise.all([onScrolledToTopRef.current?.()]);
                }
                catch(error) {
                    errorHandler(error);
                }
                stopCallingOnScrolledToTopCallback = false;
                didTopObserverCallbackRunRef.current = true;
            } 
            const options = {root: rootElement, threshold: 0.1};
            const observer = new IntersectionObserver(observerCallBack, options);
            observer.observe(targetElement);
            return () => {
                observer.unobserve(targetElement);
            };
    }, [errorHandler, didTopObserverCallbackRunRef, intersectionObserverRootRef, intersectionObserverTopTargetRef, onScrolledToTopRef]);

    useEffect(
        /**
         * Record the change in the scroll height of the scrollable list and manually set the scrollbar position of the scrollable list if some conditions are met
         */
        () => {
            if (!intersectionObserverRootRef.current) {
                return;
            }
            if (intersectionObserverRootRef.current.scrollHeight > intersectionObserverRootRef.current.clientHeight) {
                if (Math.round(intersectionObserverRootRef.current.scrollHeight - scrollHeightTupleRef.current[1]) !== 0) {
                    // Recompute scroll height tuple
                    scrollHeightTupleRef.current[0] = scrollHeightTupleRef.current[1];
                    scrollHeightTupleRef.current[1] = intersectionObserverRootRef.current.scrollHeight;
                    // If the topObserverCallback is invoked and the scrollbar position will not be handled by the scrollToBottom handler, 
                    //     set the scrollbar position
                    if (!scrollToBottom && didTopObserverCallbackRunRef.current && scrollHeightTupleRef.current[0] !== 0) {
                        intersectionObserverRootRef.current.scrollTop = Math.max(scrollHeightTupleRef.current[1] - scrollHeightTupleRef.current[0], 0);
                    }
                }
            }
            else {
                // Reset scroll height tuple
                scrollHeightTupleRef.current[0] = 0;
                scrollHeightTupleRef.current[1] = 0;
            }
            if (didTopObserverCallbackRunRef.current) {
                didTopObserverCallbackRunRef.current = false;
            }
    });

    useEffect(
        /**
         * Set the scrollbar to be at the bottom-most position of the scrollable list if some conditions are met
         */
        () => {
            setTimeout(() => {
                const rootElement = intersectionObserverRootRef.current;
                const isRootScrollable = (rootElement?.scrollHeight ?? 0) > (rootElement?.clientHeight ?? 0);
                const shouldRootScrollToBottom = scrollToBottom && isRootScrollable && intersectionObserverBottomTargetRef.current !== null;
                if (shouldRootScrollToBottom) {
                    didComponentScrollToBottomRef.current = true;
                    intersectionObserverBottomTargetRef.current!.scrollIntoView();
                }
            });
    });
}
