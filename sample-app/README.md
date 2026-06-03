<p align="center">
  <img alt="CometChat" src="https://assets.cometchat.io/website/images/logos/banner.png">
</p>

# React Sample App by CometChat

A reference application showcasing the integration of CometChat's React UI Kit v7 within a React 19 + Vite project. It demonstrates real-time messaging, voice and video calling, and AI-powered chat features.

<div style="display: flex; align-items: center; justify-content: center;">
   <img src="../screenshots/sample_app_overview.png" />
</div>

## Prerequisites

- Node.js >= 18
- npm >= 9
- A [CometChat](https://app.cometchat.com/) account with app credentials: _App ID_, _Region_, and _Auth Key_

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/cometchat/cometchat-uikit-react.git
   ```

2. Checkout the v7 branch:
   ```sh
   git checkout v7
   ```

3. Navigate to the sample app:
   ```sh
   cd cometchat-uikit-react/sample-app
   ```

4. Install dependencies:
   ```sh
   npm install
   ```

5. _(Optional)_ Enter your CometChat _App ID_, _Region_, and _Auth Key_ in [`src/AppConstants.ts`](./src/AppConstants.ts):
   ```ts
   export const AppConstants = {
     APP_ID: "YOUR_APP_ID",
     REGION: "YOUR_REGION",
     AUTH_KEY: "YOUR_AUTH_KEY",
   };
   ```
   You can also configure these at runtime through the credentials screen in the app.

6. Start the development server:
   ```sh
   npm run dev
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

## Help and Support

For issues running the project or integrating with our UI Kits, consult our [documentation](https://www.cometchat.com/docs/ui-kit/react/v7/integration) or create a [support ticket](https://help.cometchat.com/hc/en-us) or seek real-time support via the [CometChat Dashboard](https://app.cometchat.com/).
