import { useEffect } from "react";

function Hooks(
	subscribeToEvents: Function,
    user: any,
    setActiveUser: any,
) {
    useEffect(
        () => subscribeToEvents(),
        [subscribeToEvents]
    );

    useEffect(
        () => {
            setActiveUser(user);
        }, [user, setActiveUser]
    );
}

export { Hooks };