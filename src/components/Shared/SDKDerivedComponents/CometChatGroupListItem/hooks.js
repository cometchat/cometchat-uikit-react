import React from "react";

export const Hooks = (props, setTheme) => {
 	React.useEffect(() => {
		if (props.theme) {
			setTheme(props.theme);
		}
	}, [props.theme, setTheme]);
};