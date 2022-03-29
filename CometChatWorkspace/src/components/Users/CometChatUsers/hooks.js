import React from "react";

import { CometChatTheme } from "../../";

export const Hooks = (props, setTheme) => {

  	React.useEffect(() => {
		setTheme(props.theme ? props.theme : new CometChatTheme());
	}, [props.theme, setTheme]);
};
