import { CometChat } from "@cometchat-pro/chat";
import { localize } from "uikit-resources-lerna";
import { CallscreenStyle } from "uikit-utils-lerna";
import IncreaseSizeIcon from './assets/increase-size.svg';
import ReduceSizeIcon from './assets/reduce-size.svg';

interface IOngoingCallProps {
    callSettingsBuilder?: CometChat.CallSettingsBuilder,
    sessionID: string,
    ongoingCallStyle?: CallscreenStyle,
    resizeIconHoverText?: string,
    minimizeIconURL?: string,
    maximizeIconURL?: string
}

const defaultProps: IOngoingCallProps = {
    resizeIconHoverText: localize("RESIZE"),
    sessionID: '',
    minimizeIconURL: ReduceSizeIcon,
    maximizeIconURL: IncreaseSizeIcon,
    callSettingsBuilder: undefined,
    ongoingCallStyle: {
        maxHeight: "100%",
        maxWidth: "100%",
        border: "none",
        borderRadius: "0",
        background: "grey",
        minHeight: "400px",
        minWidth: "400px",
        minimizeIconTint: "white",
        maximizeIconTint: "white",
    }
};

const CometChatOngoingCall = (props: IOngoingCallProps) => {

    const {
        resizeIconHoverText,
        sessionID,
        minimizeIconURL,
        maximizeIconURL,
        ongoingCallStyle,
        callSettingsBuilder
    } = props;

    return (
        <cometchat-callscreen callscreenStyle={JSON.stringify(ongoingCallStyle)} callSettingsBuilder={callSettingsBuilder} resizeIconHoverText={resizeIconHoverText} sessionID={sessionID} minimizeIconURL={minimizeIconURL} maximizeIconURL={maximizeIconURL}></cometchat-callscreen>
    );
};

CometChatOngoingCall.defaultProps = defaultProps;
export { CometChatOngoingCall };