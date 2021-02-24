/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
    tableRowStyle,
    avatarStyle,
    nameStyle,
    roleStyle,
    actionStyle
} from "./style";

import unban from "./resources/block.png";

const CometChatBanGroupMemberListItem = (props) => {

    const roles = {}
    roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] = Translator.translate("ADMINISTRATOR", props.lang);
    roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] = Translator.translate("MODERATOR", props.lang);
    roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] = Translator.translate("PARTICIPANT", props.lang);

    let name = props.member.name;
    let scope = roles[props.member.scope];
    let unBan = (<img src={unban} alt={Translator.translate("UNBAN", props.lang)} onClick={() => {props.actionGenerated("unban", props.member)}} />);

    //if the loggedin user is moderator, don't allow unban of banned moderators or administrators
    if(props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR 
    && (props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN || props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)) {
        unBan = null;
    }

    //if the loggedin user is administrator, don't allow unban of banned administrators
    if(props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN && props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
        if(props.item.owner !== props.loggedinuser.uid) {
            unBan = null;
        }
    }

    const toggleTooltip = (event, flag) => {

        const elem = event.currentTarget;
        const nameContainer = elem.lastChild;
    
        const scrollWidth = nameContainer.scrollWidth;
        const clientWidth = nameContainer.clientWidth;
        
        if(scrollWidth <= clientWidth) {
          return false;
        }
    
        if(flag) {
          nameContainer.setAttribute("title", nameContainer.textContent);
        } else {
          nameContainer.removeAttribute("title");
        }
    }
    
    return (
        <tr css={tableRowStyle(props)}>
            <td 
            onMouseEnter={event => toggleTooltip(event, true)}
            onMouseLeave={event => toggleTooltip(event, false)}>
                <div css={avatarStyle()} className="avatar">
                    <CometChatAvatar user={props.member} />
                    <CometChatUserPresence
                    widgetsettings={props.widgetsettings}
                    status={props.member.status}
                    borderColor={props.theme.borderColor.primary} />
                </div>
                <div css={nameStyle()} className="name">{name}</div>
            </td>
            <td css={roleStyle()} className="role">{scope}</td>
            <td css={actionStyle()} className="unban">{unBan}</td>
        </tr>
    );
}

// Specifies the default values for props:
CometChatBanGroupMemberListItem.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatBanGroupMemberListItem.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default CometChatBanGroupMemberListItem;