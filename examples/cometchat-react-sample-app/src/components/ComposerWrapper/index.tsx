import { CometChat } from "@cometchat-pro/chat";
import { useContext, useEffect, useState } from "react";
import { CometChatMessageComposer, CometChatContext } from "@cometchat-pro/react-ui-kit";

type ComposerWrapperProps = { setSomeInterestingAsyncOpStarted : React.Dispatch<React.SetStateAction<boolean>> };

export function ComposerWrapper(props : ComposerWrapperProps) {
    const [group, setGroup] = useState<CometChat.Group>();
    const { theme } = useContext(CometChatContext);
    const { setSomeInterestingAsyncOpStarted, ...otherProps } = props;

    useEffect(() => {
        (async () => {
           try {
             const groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(1).build();
             setSomeInterestingAsyncOpStarted(true);
             const [fetchedGroup] = await groupsRequest.fetchNext();
             setGroup(fetchedGroup);
           }
           catch(error) {
             console.log(error);
           } 
           finally {
            setSomeInterestingAsyncOpStarted(false);
           }
        })();
    }, [setSomeInterestingAsyncOpStarted]);

    if (!group) {
        return null;
    }

    return (
        <div
            style = {{
                height: "100%",
                background: theme.palette.getBackground(),
                display: "flex",
                alignItems: "center"
            }}
        >
            <CometChatMessageComposer
                group = {group}
                messageComposerStyle = {{
                    height: "fit-content"
                }}
                {...otherProps}
            />
        </div>
    );
}
