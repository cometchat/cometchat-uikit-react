import React, { useEffect, JSX } from "react";

type Args = {
    ref : React.MutableRefObject<JSX.IntrinsicElements["cometchat-list-item"]>,
    onListItemClickPropRef : React.MutableRefObject<((customEvent: CustomEvent<{id: string}>) => void) | undefined>
};

export function Hooks(args : Args) {
    const {
        ref,
        onListItemClickPropRef
    } = args;

    useEffect(() => {
        const listItemElement = ref.current;
        const eventName = "cc-listitem-clicked";
        const handleEvent = (e : CustomEvent<{id : string}>) => onListItemClickPropRef.current?.(e);
        listItemElement.addEventListener(eventName, handleEvent);
        return () => {
            listItemElement.removeEventListener(eventName, handleEvent);
        };
    }, []);
}
