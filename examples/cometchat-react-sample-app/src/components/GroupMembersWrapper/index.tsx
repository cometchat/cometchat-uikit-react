import { CometChat } from "@cometchat-pro/chat";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CometChatGroupMembers } from "@cometchat-pro/react-ui-kit";

type GroupMembersWrapperProps = { setSomeInterestingAsyncOperation : React.Dispatch<React.SetStateAction<boolean>>};

export function GroupMembersWrapper(props : GroupMembersWrapperProps) {
    const [group, setGroup] = useState<CometChat.Group>();
    const navigate = useNavigate();
    const { setSomeInterestingAsyncOperation, ...otherProps } = props;

    useEffect(() => {
        (async () => {
            const groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(1).build();
            try {
                setSomeInterestingAsyncOperation(true);
                const [fetchedGroup] = await groupsRequest.fetchNext();
                setGroup(fetchedGroup);
            }
            catch(error) {
                console.log(error);
            }
            finally {
                setSomeInterestingAsyncOperation(false);
            }
        })();
    }, [setSomeInterestingAsyncOperation]);
    
    if (!group) {
        return null;
    }

    return (
        <CometChatGroupMembers
            group = {group}
            onBack = {() => navigate(-1)}
            onClose = {() => navigate("/home/groups-module")}
            {...otherProps}
        />
    );
}
