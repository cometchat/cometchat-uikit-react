import { CometChat } from "@cometchat-pro/chat";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CometChatDetails } from "@cometchat-pro/react-ui-kit";

type UserDetailsProps = { setInterestingAsyncOpStarted: React.Dispatch<React.SetStateAction<boolean>>}

export function UserDetails(props : UserDetailsProps) {
    const [user, setUser] = useState<CometChat.User>();
    const navigate = useNavigate();
    const { setInterestingAsyncOpStarted } = props;

    useEffect(() => {
        (async () => {
            const usersRequest = new CometChat.UsersRequestBuilder().setLimit(1).build();
            try {
                setInterestingAsyncOpStarted(true);
                const [fetchdUser] = await usersRequest.fetchNext();
                setUser(fetchdUser);
            }
            catch(error) {
                console.log(error);
            }
            finally {
                setInterestingAsyncOpStarted(false);
            }
        })();
    }, [setInterestingAsyncOpStarted]);

    return (
        <CometChatDetails
            user = {user}
            onClose = {() => navigate("/home/users-module")}
            {...props}
        />
    );
}
