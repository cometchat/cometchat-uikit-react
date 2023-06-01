import { CometChat } from "@cometchat-pro/chat";
import { useEffect } from "react";

interface IEffectsProps {
    setLoggedInUser : React.Dispatch<React.SetStateAction<CometChat.User | null | undefined>>,
    observableRef :  React.MutableRefObject<HTMLDivElement | null>,
    setIsMobileView : React.Dispatch<React.SetStateAction<boolean>>
};

export function Effects(props : IEffectsProps) {
    const {
        setLoggedInUser,
        observableRef,
        setIsMobileView
    } = props;

    useEffect(() => {
        (async () => {
            try {
                setLoggedInUser(await CometChat.getLoggedinUser());
            }
            catch(error) {
                console.log(error);
            }
        })();
    }, [setLoggedInUser]);

    useEffect(() => {
        const observableElement = observableRef.current;
        if (!observableElement) {
            return;
        }
        const callback = (entries : IntersectionObserverEntry[]) => {
            const firstEntry = entries[0];
            setIsMobileView(!firstEntry.isIntersecting);
        };
        const observer = new IntersectionObserver(callback, {root: null, threshold: 1});
        observer.observe(observableElement);
        return () => {
            observer.unobserve(observableElement);
        };
    }, [setIsMobileView, observableRef]);
}
