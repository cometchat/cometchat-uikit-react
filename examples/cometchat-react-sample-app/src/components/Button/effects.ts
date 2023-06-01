import { useEffect } from "react";

interface IEffectsProps {
    ref : React.MutableRefObject<JSX.IntrinsicElements["cometchat-button"]>,
    onClickPropRef : React.MutableRefObject<((customEvent: CustomEvent<{event: PointerEvent}>) => void) | undefined>
};

export function Effects(props : IEffectsProps) {
    const {
        ref,
        onClickPropRef
    } = props;

    useEffect(() => {
        const buttonElement = ref.current;
        const eventName = "cc-button-clicked";
        const handleEvent = (e : CustomEvent<{event : PointerEvent}>) => onClickPropRef.current?.(e);
        buttonElement.addEventListener(eventName, handleEvent);
        return () => {
            buttonElement.removeEventListener(eventName, handleEvent);
        };
    }, [onClickPropRef, ref]); // Refs are in the dependency array to satisfy ESlint
}
