import React, { useEffect, JSX } from "react";

type Args = {
    ref : React.MutableRefObject<JSX.IntrinsicElements["cometchat-checkbox"]>,
    onChangePropRef : React.MutableRefObject<((customEvent: CustomEvent<{checked: boolean;}>) => void) | undefined>
};

export function Hooks(args : Args) {
    const {
        ref,
        onChangePropRef
    } = args;

    useEffect(() => {
        const checkboxElement = ref.current;
        const eventName = "cc-checkbox-changed";
        const handleEvent = (e : CustomEvent<{checked : boolean}>) => onChangePropRef.current?.(e);
        checkboxElement.addEventListener(eventName, handleEvent);
        return () => {
            checkboxElement.removeEventListener(eventName, handleEvent);
        };
    }, []);
}
