import React from "react";

export const Hooks = (props, setActionList) => {
    
	React.useEffect(() => {
		if (props.actions.length) {
			setActionList([...props.actions]);
		}
	}, []);
};
