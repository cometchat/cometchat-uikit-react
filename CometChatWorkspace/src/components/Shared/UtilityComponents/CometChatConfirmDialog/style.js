export const dialogBackdropStyle = props => {

	const display = props.isOpen ? { display: "block" } : { display: "none" };

	return {
		zIndex: "3",
		backgroundColor: "#000",
		opacity: ".3",
		width: "100%",
		height: "100%",
		top: "0",
		left: "0",
		cursor: "pointer",
		transition: "background .3s ease-out 0",
		position: "fixed",
		...display,
	};
};

export const dialogLoadingWrapperStyle = (props, state) => {

	const display = state === "loading" ? { display: "flex" } : { display: "none" };
	return {
		justifyContent: "center",
		alignItems: "center",
		height: "50px",
		width: "100%",
		...display,
	};
};

export const dialogLoadingStyle = (props, state, img) => {

	return {
		background: `url(${img}) center center`,
		width: "24px",
		height: "24px",
	};
};

export const dialogWrapperStyle = props => {

	const display = props.isOpen ? { display: "block" } : { display: "none" };

	return {
		width: props.width,
		height: "auto",
		backgroundColor: props.background,
		position: "absolute",
		margin: "0 auto",
		padding: "16px",
		fontSize: "13px",
		borderRadius: "8px",
		border: "1px solid #eee",
		zIndex: "4",
		top: "50%",
		left: "0",
		right: "0",
		transform: "translateY(-50%)",
		...display,
	};
};

export const dialogFormStyle = (props, state) => {

	const display = (state === "initial" || state === "done") ? { display: "block" } : { display: "none" };
	return {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		...display,
	}
}

export const dialogErrorStyle = (props, state) => {
	
	const display = (state==="error") ? {display: "block"}: {display:"none"};
	return {
		font: "11px Inter",
		color: "red",
		textAlign: "center",
		...display,
	};
}

export const dialogMessageStyle = () => {
	return {
		textAlign: "center",
	};
};

export const dialogButtonStyle = props => {
	return {
		display: "flex",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		margin: "24px 0 0 0",
	};
};

export const buttonConfirmStyle = props => {

	return {
		padding: "5px 24px",
		margin: "0 8px",
		borderRadius: "4px",
		font: "600 12px Inter,sans-serif",
		border: `1px solid #39f`,
		backgroundColor: `#39f!important`,
		color: `#808080`,
	};
};

export const buttonCancelStyle = props => {

	return {
		padding: "5px 24px",
		margin: "0 8px",
		borderRadius: "4px",
		font: "600 12px Inter,sans-serif",
		border: `1px solid #39f`,
		backgroundColor: `#808080!important`,
		color: "#808080",
	};
}
