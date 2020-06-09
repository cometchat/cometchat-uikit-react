
# React Chat UI Kit
React Chat UI Kit is a collection of custom UI Components and UI Screens designed to build chat application with fully customizable UI. It is designed to avoid boilerplate code for building UI. 

![alt text](https://files.readme.io/68c7762-launch_cometchat.png "UI Unified")

It has the following 3 ways of implementation:
* [UI Unified](https://prodocs.cometchat.com/docs/react-ui-kit-ui-unified)
* [UI Screens](https://prodocs.cometchat.com/docs/react-ui-kit-ui-screens)
* [UI Components](https://prodocs.cometchat.com/docs/react-ui-kit-ui-components)

## Requirements
 1. [CometChat Account](#cometchat-account)

### CometChat Account
To use this library, you need application keys from your CometChat account. If you don't have an account, you can create one <a href="https://app.cometchat.io/" target="_blank">here</a>.

1. Sign in to your <a href="https://app.cometchat.io/" target="_blank">CometChat Dashboard</a>
2. Click **Add New App**
3. Give your app a name, and select a region and click  Add App
4. Click your new app to open its settings.
5. Locate API Keys and Create Auth Key. You'll need `App ID`, `Auth Key` and `Region`


### Install CometChat SDK

```javascript
    npm install @cometchat-pro/chat@2.0.9 --save
```

### Import `CometChat` Object

```javascript
    import { CometChat } from "@cometchat-pro/"
```

### Initialize CometChat

The `init()` method initializes the settings required for CometChat.
 We suggest calling the `init()` method on app startup, preferably in the `onCreate()` method of the Application class.
```javascript
const appID = "APP_ID";
const region = "REGION";
const appSetting = new CometChat.AppSettingsBuilder().subscribePresenceForAllUsers().setRegion(region).build();
CometChat.init(appID, appSetting).then(
  () => {
    console.log("Initialization completed successfully");
    // You can now call login function.
  },
  error => {
    console.log("Initialization failed with error:", error);
    // Check the reason for error and take appropriate action.
  }
);
```
**Note:**
Replace APP_ID and REGION with your CometChat `App ID` and `REGION` in the above code.

### Log in your User

Once initialization is successful, you will need to create a user.
To create users on the fly, you can use the `createUser()` method. This method takes a User object and the `Auth Key` as input parameters and returns the created User object if the request is successful.

```javascript
const authKey = "AUTH_KEY";
const uid = "UID";
const name = "NAME";

const user = new CometChat.User(uid);

user.setName(name);

CometChat.createUser(user, authKey).then(
    user => {
        console.log("user created", user);
    },error => {
        console.log("error", error);
    }
);
```
**Note:** </br>
* Replace `AUTH_KEY` with your CometChat `Auth Key` in the above code.
* Replace `UID` and `NAME` with the uid and name of the user to be created.
* We have setup 5 users for testing having UIDs: `SUPERHERO1`, `SUPERHERO2`, `SUPERHERO3`,`SUPERHERO4` and `SUPERHERO5`.


Once you have created the user successfully, you need to use the `login()` method.

```javascript
const authKey = "AUTH_KEY";
const uid = "UID";

CometChat.login(uid, authKey).then(
  user => {
    console.log("Login Successful:", { user });    
  },
  error => {
    console.log("Login failed with exception:", { error });    
  }
);
```
**Note:** </br>
* Replace `AUTH_KEY` with your CometChat `Auth Key` in the above code.
* Replace `UID` with the uid of the user created.


## Usage
1. Download or clone this repository
2. Copy the CometChat folder to your project folder
3. Import the components.

Here is an implementation of UI Unified. 


 ```html
 import {CometChatUnified} from "./CometChat";
 render() {
    return (
        <CometChatUnified />
    );
  }
 ```
</br>



## Further Information
 Please refer our [Documentation](https://prodocs.cometchat.com/docs/react-ui-kit) for more information about how to integrate UI Kit to your applications.

Please visit our [Forum](https://forum.cometchat.com/) if you are facing any issues while installation or integration of this library.
