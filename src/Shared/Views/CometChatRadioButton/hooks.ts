import React, { useEffect, JSX } from "react";

type Args = {
    ref : React.MutableRefObject<JSX.IntrinsicElements["cometchat-radio-button"]>,
    onChangePropRef : React.MutableRefObject<((customEvent: CustomEvent<{checked: true}>) => void) | undefined>
};

export function Hooks(args : Args) {
    const {
        ref,
        onChangePropRef
    } = args;

    useEffect(() => {
        const radioBtnElement = ref.current;
        const eventName = "cc-radio-button-changed";
        const handleEvent = (event : CustomEvent<{checked : true}>) => onChangePropRef.current?.(event);
        radioBtnElement.addEventListener(eventName, handleEvent);
        return () => {
            radioBtnElement.removeEventListener(eventName, handleEvent);
        };
    }, []);
}
