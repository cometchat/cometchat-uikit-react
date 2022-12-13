import { useContext } from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
	modalRowStyle,
	userStyle,
	avatarStyle,
	nameStyle,
	roleStyle,
	actionStyle,
} from "./style";

import unban from "./resources/ban-member.svg";

const CometChatBanGroupMemberListItem = (props) => {
	const context = useContext(CometChatContext);

	let name = props.member.name;
	let scope = context.roles[props.member.scope];
	let unBan = (
		<i
			title={Translator.translate("UNBAN", context.language)}
			onClick={() => {
				props.actionGenerated(
					enums.ACTIONS["UNBAN_GROUP_MEMBER"],
					props.member
				);
			}}
		/>
	);

	//if the loggedin user is moderator, don't allow unban of banned moderators or administrators
	if (
		context.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR &&
		(props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN ||
			props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)
	) {
		unBan = null;
	}

	//if the loggedin user is administrator, don't allow unban of banned administrators
	if (
		context.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN &&
		props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN
	) {
		if (context.item.owner !== props.loggedinuser.uid) {
			unBan = null;
		}
	}

	const toggleTooltip = (event, flag) => {
		const elem = event.currentTarget;
		const nameContainer = elem.lastChild;

		const scrollWidth = nameContainer.scrollWidth;
		const clientWidth = nameContainer.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

		if (flag) {
			nameContainer.setAttribute("title", nameContainer.textContent);
		} else {
			nameContainer.removeAttribute("title");
		}
	};

	return (
		<div css={modalRowStyle(context)}>
			<div
				css={userStyle(context)}
				className='userinfo'
				onMouseEnter={(event) => toggleTooltip(event, true)}
				onMouseLeave={(event) => toggleTooltip(event, false)}
			>
				<div css={avatarStyle()} className='avatar'>
					<CometChatAvatar user={props.member} />
					<CometChatUserPresence
						status={props.member.status}
						borderColor={props.theme.borderColor.primary}
					/>
				</div>
				<div css={nameStyle()} className='name'>
					{name}
				</div>
			</div>
			<div css={roleStyle(context)} className='role'>
				{scope}
			</div>
			<div css={actionStyle(unban, context)} className='unban'>
				{unBan}
			</div>
		</div>
	);
};

// Specifies the default values for props:
CometChatBanGroupMemberListItem.defaultProps = {
	theme: theme,
};

CometChatBanGroupMemberListItem.propTypes = {
	theme: PropTypes.object,
};

export { CometChatBanGroupMemberListItem };
