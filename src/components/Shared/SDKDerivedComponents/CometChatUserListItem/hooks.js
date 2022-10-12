import React from "react";

const Hooks = (props, setTheme) => {

  	React.useEffect(() => {
		
		if (props.theme) {
			setTheme(props.theme);
		}
		
	}, [props.theme, setTheme]);
};

export { Hooks };