import React, { useEffect, JSX } from "react";
import { CometChatOption } from "uikit-resources-lerna";
import { CometChatUIKitUtility } from "uikit-utils-lerna";

type Args = {
    data : CometChatOption[],
    idToOnClickMapRef : React.MutableRefObject<Map<string | undefined, (() => void) | undefined> | null>,
    ref : React.MutableRefObject<JSX.IntrinsicElements["cometchat-menu-list"]>,
    onOptionClickPropRef : React.MutableRefObject<((customEvent: CustomEvent<{data: CometChatOption}>) => void) | undefined>
};

export function Hooks(args : Args) {
    const {
        data,
        idToOnClickMapRef,
        ref,
        onOptionClickPropRef
    } = args;

    useEffect(() => {
        const idToOnClickMap = new Map<string | undefined, (() => void) | undefined>();
        idToOnClickMapRef.current = idToOnClickMap;
        for (let i = 0; i < data.length; i++) {
            const { id, onClick } = data[i];
            idToOnClickMap.set(id, onClick);
        }
    }, [data]);

    useEffect(() => {
        const menuListElement = ref.current;
        const eventName = "cc-menu-clicked";
        const handleEvent = (event : CustomEvent<{data : CometChatOption}>) => {
            const option = CometChatUIKitUtility.clone(event.detail.data);
            option.onClick = idToOnClickMapRef.current?.get(option.id);
            event.detail.data = option; 
            onOptionClickPropRef.current?.(event);
        };
        menuListElement.addEventListener(eventName, handleEvent);
        return () => {
            menuListElement.removeEventListener(eventName, handleEvent);
        };
    }, []);
}
