import React, { useEffect, JSX } from "react";

type Args = {
    ref : React.MutableRefObject<JSX.IntrinsicElements["cometchat-button"]>,
    onClickPropRef : React.MutableRefObject<((customEvent: CustomEvent<{event: PointerEvent}>) => void) | undefined>,
};

export function Hooks(args : Args) {
    const {
        ref,
        onClickPropRef
    } = args;

    useEffect(() => {
        const buttonElement = ref.current;
        const eventName = "cc-button-clicked";
        const handleEvent = (e : CustomEvent<{event : PointerEvent}>) => onClickPropRef.current?.(e);
        buttonElement.addEventListener(eventName, handleEvent);
        return () => {
            buttonElement.removeEventListener(eventName, handleEvent);
        };
    }, []);
}
