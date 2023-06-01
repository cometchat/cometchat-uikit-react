import { CometChat } from "@cometchat-pro/chat"
import { CometChatDetailsOption, CometChatDetailsTemplate, localize } from "uikit-resources-lerna"
import { CallButtonsStyle } from "uikit-utils-lerna"
import { CometChatCallButtons } from "../CometChatCallButtons"

export class CallingDetailsUtils {
    
    public static getDetailsTemplate(user?: CometChat.User, group?: CometChat.Group): Array<CometChatDetailsTemplate> {
        return [
            this.getPrimaryDetailsTemplate(user, group)
        ]
    }

    private static getCallButtons(user?: CometChat.User, group?: CometChat.Group){
        let style: CallButtonsStyle = {
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            buttonPadding: "8px 32px",
            buttonBackground: "RGBA(20, 20, 20, 0.04)",
            buttonBorder: "0 4px",
            buttonBorderRadius: "10px"
        }
        return <CometChatCallButtons user={user} group={group} callButtonsStyle={style} voiceCallIconText={localize("AUDIO_CALL")} videoCallIconText={localize("VIDEO_CALL")} key={'callbuttons'} />
    }

    public static getPrimaryDetailsTemplate(user1?: CometChat.User, group1?: CometChat.Group): CometChatDetailsTemplate {
        let template: CometChatDetailsTemplate = new CometChatDetailsTemplate({
            id: "callControls",
            hideSectionSeparator: true,
            options: (user: CometChat.User | null, group: CometChat.Group | null) => {
                return this.getPrimaryOptions(user ?? undefined, group ?? undefined);
            }
        });
        return template;
    }

    private static getPrimaryOptions(user?: CometChat.User, group?: CometChat.Group): CometChatDetailsOption[] {
        let options: CometChatDetailsOption[] = [];
        options.push(
            new CometChatDetailsOption({
                id: 'callControls',
                customView: this.getCallButtons(user, group),
            })
        )
        return options;
    }

}