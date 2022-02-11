import {CometChat} from "@cometchat-pro/chat"
import { useEffect } from "react";
import { CometChatLocalize } from "../CometChatWorkspace/src/components/Shared";
// const COMETCHAT_CONSTANTS = {
//   APP_ID: '2012109f0ca0568b',
//   REGION: 'us',
//   AUTH_KEY: '9dee5986129c7b1d60dbab4b8463e7a73d3a002f'
// }
const COMETCHAT_CONSTANTS = {
  APP_ID: "2026561c13035efd",
  REGION: "eu",
  AUTH_KEY: "f121f4e440d75c60d58c97e1ee1572a33ddea1cf",
};
const withThemeProvider = (Story,context) => {
  useEffect(() => {
    const appSetting = new CometChat.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(COMETCHAT_CONSTANTS.REGION)
      .build();
    CometChat.init(COMETCHAT_CONSTANTS.APP_ID, appSetting).then(
      () => {
        console.log('Initialization completed successfully');
        // You can now call login function.
      },
      (error) => {
        console.log('Initialization failed with error:', error);
        // Check the reason for error and take appropriate action.
      }
    );
    const UID = 'SUPERHERO1';

   CometChat.getLoggedinUser().then(
	user => {
  	if(!user){
			CometChat.login(UID, COMETCHAT_CONSTANTS.AUTH_KEY).then(
        user => {
          console.log("Login Successful:", { user });
        }, error => {
          console.log("Login failed with exception:", { error });
        }
      );
    }
	}, error => {
		console.log("Something went wrong", error);
	}
);
    CometChatLocalize.init({
      language: "en"
    })
    document.head.insertAdjacentHTML("beforeend", `<style>*{box-sizing:border-box}</style>`)
  }, [])
  return (
    <div>
      <Story {...context} />
    </div>
  )
}
export const decorators = [withThemeProvider];
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}