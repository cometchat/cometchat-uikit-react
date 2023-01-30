import React from "react";
import { CometChatContext } from "../../../util/CometChatContext";

function CometChatAuthentication(WrappedComponent) {
	return class AuthenticatedComponent extends React.Component {
		static contextType = CometChatContext;

		constructor(props, context) {
			super(props, context);

			this.state = {
				loggedInUser: null,
			};
		}

		componentDidMount() {
			this.context.getLoggedinUser().then((user) => {
				this.setState({ loggedInUser: { ...user } });
			});
		}
		/**
		 * Check if the user is authenticated, this.props.isAuthenticated
		 * has to be set from your application logic (or use react-redux to retrieve it from global state).
		 */
		isAuthenticated() {
			return this.props.isAuthenticated;
		}

		/**
		 * Render
		 */
		render() {
			return (
				<div>
					{this.state.loggedInUser === null ? null : (
						<WrappedComponent
							{...this.props}
							loggedInUser={this.state.loggedInUser}
						/>
					)}
				</div>
			);
		}
	};
}

export { CometChatAuthentication };
