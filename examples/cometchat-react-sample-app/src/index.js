import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from "./App/App";
import reportWebVitals from './reportWebVitals';
import { CometChat } from "@cometchat-pro/chat"
import { COMETCHAT_CONSTANTS } from './consts';

var appID = COMETCHAT_CONSTANTS.APP_ID;
var region = COMETCHAT_CONSTANTS.REGION;


const root = ReactDOM.createRoot(document.getElementById('root'));

var appSetting = new CometChat.AppSettingsBuilder().subscribePresenceForAllUsers().setRegion(region).build();
CometChat.init(appID, appSetting).then(() => {

  if (CometChat.setSource) {
    CometChat.setSource("ui-kit", "web", "reactjs");
  }
  console.log("Initialization completed successfully");

  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
},
  error => {
    console.log("Initialization failed with error:", error);
    // Check the reason for error and take appropriate action.
  }
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
reportWebVitals();
