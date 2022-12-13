import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";

import { CometChatBackdrop } from "../";
import Translator from "../../../resources/localization/translator";

import {
	alertWrapperStyle,
	alertMessageStyle,
	alertButtonStyle,
} from "./style";

class CometChatConfirmDialog extends React.Component {
	render() {
		const confirmButtonText = this.props?.confirmButtonText
			? this.props.confirmButtonText
			: Translator.translate("YES", this.context.language);
		const cancelButtonText = this.props?.cancelButtonText
			? this.props.cancelButtonText
			: Translator.translate("NO", this.getContext().language);

		return (
			<React.Fragment>
				<CometChatBackdrop
					show={true}
					style={{ position: "absolute" }}
					clicked={this.props.close}
				/>
				<div className='confirm__dialog' css={alertWrapperStyle(this.props)}>
					<div className='confirm__message' css={alertMessageStyle(this.props)}>
						{this.props?.message}
					</div>
					<div className='confirm__buttons' css={alertButtonStyle(this.props)}>
						<button type='button' value='no' onClick={this.props.onClick}>
							{cancelButtonText}
						</button>
						<button type='button' value='yes' onClick={this.props.onClick}>
							{confirmButtonText}
						</button>
					</div>
				</div>
			</React.Fragment>
		);
	}
}

export { CometChatConfirmDialog };
