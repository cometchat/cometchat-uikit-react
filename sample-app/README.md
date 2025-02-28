<p align="center">
  <img alt="CometChat" src="https://assets.cometchat.io/website/images/logos/banner.png">
</p>

# React Sample App by CometChat

This is a reference application showcasing the integration of [CometChat's React UI Kit](https://www.cometchat.com/docs/ui-kit/react/overview) within a React framework. It provides developers with examples of implementing real-time messaging and voice and video calling features in their own React-based applications.

<div style="display: flex; align-items: center; justify-content: center">
   <img src="../screenshots/sample_app_overview.png" />
</div>

## Prerequisites

- Ensure that you have Node.js and npm installed:

  ```sh
    npm install npm@latest -g
  ```

- Sign up for a [CometChat](https://app.cometchat.com/) account to get your app credentials: _`App ID`_, _`Region`_, and _`Auth Key`_

## Installation

1. Clone the repository:
   ```sh
     git clone https://github.com/cometchat/cometchat-uikit-react.git
   ```

2. Checkout v5 branch:
   ```sh
     git checkout v5
   ```

3. Navigate to the cloned directory:
   ```sh
     cd cometchat-uikit-react/sample-app
   ```
4. Install dependencies:
   ```sh
     npm install
   ```
5. `[Optional]` Enter your CometChat _`App ID`_, _`Region`_, and _`Auth Key`_ in the [sample-app/src/AppConstants.ts](https://github.com/cometchat/cometchat-sample-app-react/blob/v5/sample-app/src/AppConstants.ts) file:https://github.com/cometchat/cometchat-uikit-react/blob/2dba5e2e781db6d2f20c59803ff7f8cef4e7c187/sample-app/src/AppConstants.ts#L1-L5

6. Run the project locally to see all CometChat features in action:
   ```
     npm start
   ```

## Help and Support

For issues running the project or integrating with our UI Kits, consult our [documentation](https://www.cometchat.com/docs/ui-kit/react/integration) or create a [support ticket](https://help.cometchat.com/hc/en-us) or seek real-time support via the [CometChat Dashboard](http://app.cometchat.com/).