import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CometChatContext } from "@cometchat-pro/react-ui-kit";
import { createGroupStyle, createGroupWrapperStyle } from "./style";

type CreateGroupWrapperProps = { isMobileView : boolean };

export function CreateGroupWrapper({ isMobileView } : CreateGroupWrapperProps) {
    const createGroupRef = useRef<JSX.IntrinsicElements["cometchat-create-group"] | null>(null);
    const navigate = useNavigate();
    const { theme } = useContext(CometChatContext);    

    useEffect(() => {
        const createGroupElement = createGroupRef.current;
        if (!createGroupElement) {
            return;
        }
        // const createGroupEventName = "cc-creategroup-created";
        const closeClickedEventName = "cc-creategroup-close-clicked";
        const handleCreateGroup = (e : CustomEvent) => {
            console.log("Group details:", e);
        };
        const handleCloseClicked = () => navigate("/home/groups-module"); 
        createGroupElement.createClick = handleCreateGroup;
        createGroupElement.addEventListener(closeClickedEventName, handleCloseClicked);
        return () => {
            createGroupElement.createClick = null;
            createGroupElement.removeEventListener(closeClickedEventName, handleCloseClicked);
        };
    }, [navigate]);

    return (
        <div
            style = {createGroupWrapperStyle(theme)}
        >
            <cometchat-create-group
                ref = {createGroupRef}
                createGroupStyle = {JSON.stringify(createGroupStyle(isMobileView, theme))}
            />
        </div>
    );
}
