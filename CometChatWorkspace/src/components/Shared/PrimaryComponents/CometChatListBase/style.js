import { CometChatLocalize } from "../../../Shared";

export const listBaseStyle = props => {
	return {
		display: "flex",
		flexDirection: "column",
		alignItems: "flex-start",
		justifyContent: "center",
		padding: "16px 0",
		width: props.width,
		height: props.height,
		background: props.background,
		borderRadius: props.cornerRadius,
		border: props.border,
	};
};

export const listBaseHeadStyle = props => {
	const height = !props.hideSearch
		? {
				height: "101px",
		  }
		: {
				height: "40px",
		  };

	return {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		...height,
	};
};

export const listBaseNavStyle = props => {
	return {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		height: "100%",
		width: "100%",
		marginBottom: "16px",
	};
};

export const backButtonStyle = props => {
	return {
		mask: `url(${props.backIcon}) no-repeat left center`,
		backgroundColor: `${props.backIconTint}`,
		height: "24px",
		width: "24px",
		cursor: "pointer",
	};
};

export const listBaseTitleStyle = props => {
	return {
		font: props.titleFont,
		color: props.titleColor,
		lineHeight: "26px",
		width: "100%",
	};
};

export const listBaseSearchStyle = props => {

	return {
		borderRadius: props.searchCornerRadius,
		boxShadow: `${props.searchBackground} 0 0 0 1px inset`,
		backgroundColor: props.searchBackground,
		font: props.searchTextFont,
		color: props.searchTextColor,
		lineHeight: "20px",
		height: "35px",
		width: "100%",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: "24px",
	};
};

export const listBaseSearchButtonStyle = (searchIcon, props) => {
	return {
		width: "35px",
		height: "100%",
		padding: "8px 0 8px 8px",
		cursor: "default",
		mask: `url(${searchIcon}) center center no-repeat`,
		backgroundColor: `${props.searchTextColor}!important`,
	};
};

export const listBaseSearchInputStyle = props => {

    const padding = CometChatLocalize.isRTL() ? { padding: "8px 0 8px 8px" } : { padding: "8px 8px 8px 0" };
	return {
		width: "calc(100% - 35px)",
		outline: "none",
		height: "100%",
		font: props.searchTextFont,
		color: props.searchTextColor,
		backgroundColor: "transparent",
		border: props.searchBorder,
		...padding,
	};
};

export const listBaseContainerStyle = props => {
	const height = !props.hideSearch
		? {
				height: "calc(100% - 101px)",
		  }
		: {
				height: "calc(100% - 50px)",
		  };

	return {
		background: "inherit",
		width: "100%",
		...height,
	};
};
