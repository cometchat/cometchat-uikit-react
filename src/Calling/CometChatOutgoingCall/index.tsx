import { CometChat } from "@cometchat-pro/chat";
import { AvatarStyle } from "my-cstom-package-lit";
import { useCallback, useRef, useContext, CSSProperties } from "react";
import { CometChatUIKitConstants, IconButtonAlignment, localize } from "uikit-resources-lerna";
import { CometChatSoundManager, OutgoingCallStyle } from "uikit-utils-lerna";
import { Hooks } from "./hooks";
import { CometChatContext } from "../../CometChatContext";
import { OutgoingCallCancelButtonStyle, OutgoingCallCardStyle, OutgoingCallSubtitleStyle, OutgoingCallWrapperStyle, buttonStyle, defaultAvatarStyle, defaultOutgoingCallStyle } from "./style";
import Close2xIcon from './assets/close2x.svg';

interface IOutgoingCallProps {
    call: CometChat.Call,
    disableSoundForCalls?: boolean,
    customSoundForCalls?: string,
    declineButtonText?: string,
    declineButtonIconURL?: string,
    customView?: any,
    onError?: Function,
    avatarStyle?: AvatarStyle,
    outgoingCallStyle?: OutgoingCallStyle,
    onCloseClicked?: Function
}

type IconButtonStyle = CSSProperties & Partial<{
    buttonTextFont : string,
    buttonTextColor : string,
    iconTint : string,
    iconBackground : string,
}>;

const CometChatOutgoingCall = (props: IOutgoingCallProps) => {
    
    const {
        call,
        disableSoundForCalls = false,
        customSoundForCalls = "",
        declineButtonText = localize("CANCEL"),
        declineButtonIconURL = Close2xIcon,
        customView = null,
        onError = (error: CometChat.CometChatException) => { console.log(error); },
        avatarStyle = new AvatarStyle({
            borderRadius: "50%",
            width: "180px",
            height: "180px",
        }),
        outgoingCallStyle = new OutgoingCallStyle({
            width: "100%",
            height: "100%",
            titleTextFont: "700 22px Inter",
            titleTextColor: "RGB(20, 20, 20)",
            subtitleTextFont: "400 15px Inter",
            subtitleTextColor: "RGBA(20, 20, 20, 0.58)",
            declineButtonTextFont:"400 12px Inter",
            declineButtonTextColor:"RGBA(20, 20, 20, 0.58)",
            declineButtonIconTint:"white",
            declineButtonIconBackground:"red"
        }),
        onCloseClicked = () => {}
    } = props;

    const { theme } = useContext(CometChatContext);

    const iconAlignment: IconButtonAlignment = IconButtonAlignment.top;
    
    const avatarStyleRef = useRef(avatarStyle);
    const outgoingCallStyleRef = useRef(outgoingCallStyle);
    const buttonStyleRef = useRef<IconButtonStyle>(buttonStyle);
    const callRef = useRef<CometChat.Call | null>(null);
    const cancelCallButtonRef = useRef(null);

    callRef.current = call;

    avatarStyleRef.current = { ...defaultAvatarStyle(theme), ...avatarStyleRef?.current };

    outgoingCallStyleRef.current = { ...defaultOutgoingCallStyle(theme), ...outgoingCallStyleRef?.current };

    buttonStyleRef.current = OutgoingCallCancelButtonStyle(outgoingCallStyleRef?.current);

    OutgoingCallCardStyle.titleColor = outgoingCallStyleRef?.current?.titleTextColor;
    OutgoingCallCardStyle.titleFont = outgoingCallStyleRef?.current?.titleTextFont;
    
    let subtitleText: string = localize("CALLING");

    const onErrorCallback = useCallback((error: any) => {
        if (!(error instanceof CometChat.CometChatException)) {
            let errorModel = {
                code: error?.code,
                name: error?.name,
                message: error?.message,
                details: error?.details
            }
            let errorObj = new CometChat.CometChatException(errorModel);
            onError!(errorObj);
        } else {
            onError!(error);
        }
    }, [onError]);

    const onClose = useCallback(() => {
        try{
            CometChatSoundManager.pause();
            if (onCloseClicked) {
                onCloseClicked();
            }
        }catch(e){
            onErrorCallback(e);
        }
    }, [onCloseClicked, onErrorCallback])

    const getAvatarURL = () => {
        return callRef.current?.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user ? (callRef.current?.getReceiver() as CometChat.User)?.getAvatar() : (callRef.current?.getReceiver() as CometChat.Group)?.getIcon();
    }

    const playAudio = useCallback(() => {
        try{
            if(!disableSoundForCalls){
                if (customSoundForCalls) {
                    CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall, customSoundForCalls)
                } else {
                    CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall)
                }
            }
        }catch(e){
            onErrorCallback(e);
        }
    }, [disableSoundForCalls, customSoundForCalls, onErrorCallback])

    Hooks(
        playAudio, 
        call, 
        onClose, 
        cancelCallButtonRef
    );

    return (
        <>
            <div className="cc-outgoingcall__wrapper" style={OutgoingCallWrapperStyle(outgoingCallStyleRef?.current)}>
                {
                    customView ? 
                        <div className="cc-outgoingcall__custom-view">
                            {customView}
                        </div> :
                        callRef.current ?
                            <cometchat-card title={callRef.current?.getReceiver()?.getName()} cardStyle={JSON.stringify(OutgoingCallCardStyle)} avatarName={callRef.current?.getReceiver()?.getName()} avatarURL={getAvatarURL()} avatarStyle={JSON.stringify(avatarStyleRef?.current)}>
                                <cometchat-label slot="subtitleView" labelStyle={JSON.stringify(OutgoingCallSubtitleStyle(outgoingCallStyleRef?.current))} text={subtitleText}> </cometchat-label>
                                <div slot="bottomView">
                                    <cometchat-icon-button ref={cancelCallButtonRef} text={declineButtonText} iconURL={declineButtonIconURL} alignment={iconAlignment} buttonStyle={JSON.stringify(buttonStyleRef?.current)}></cometchat-icon-button>
                                </div>
                            </cometchat-card> :
                            null
                }
            </div>
        </>
    );
};

export { CometChatOutgoingCall };