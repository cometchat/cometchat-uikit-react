## [6.2.4] - 15-10-2025

## New
- None

## Enhancements
- None

## Fixes
- Fixed an issue where the search and details components did not close when switching chats by clicking on a mentioned user.
- Resolved an issue where user statuses were not updating in real time in the Group Members section after adding users to a group.

## [6.2.3] - 17-09-2025

## New
- None

## Enhancements
- None

## Fixes
- Resolved a UI issue in call log details where the interface broke when switching tabs after changing the localization language.
- Resolved an issue where leaving a group still kept the chat window for that group open.

## [6.2.2] - 04-09-2025

## New
- None

## Enhancements
- None

## Fixes
- Fixed missing **localization** in the sample app for **call log details** and the **create group** components.

## Deprecations
- None

## Removals
- None

## [6.2.1] - 22-08-2025

## New
- None

## Enhancements
- None

## Fixes
- Resolved a bug where the search input remained active even when the **Message Information** modal was open.
- User detail shimmer was missing in the call log detail view.
- Fixed an issue where the **Messages Search** component did not close if its conversation was deleted from the details page.

## Removals
- None

## [6.2.0] - 14-08-2025

## New
- Added `CometChatAIAssistantChat` component for agent chats, enabling seamless integration of AI-driven conversations.

## Enhancements
- Changed the class name target from `messages-wrapper` to `cometchat-messages-wrapper` to fix conflicts between UI Kit and Sample App styling.

## Fixes
- None

## Removals
- None

## [6.1.0] - 16-06-2025

## New
- Implemented the `onSearchOptionClicked` prop from the UI Kit in `CometChatMessageHeader`, allowing users to search messages within a specific chat using the `CometChatSearch` component. Search filters include Audio, Video, Photo, File, and Link messages.
- Implemented the `onSearchBarClicked` prop from the UI Kit in `CometChatConversations`, enabling search across all conversations and messages via the `CometChatSearch` component. Filters are available for Unread and Group conversations, and for Audio, Video, Photo, File, and Link messages.
- Implemented navigation to a specific message from search results using the `goToMessageId` prop of `CometChatMessageList`.
- Implemented the `onSubtitleClicked` prop of `CometChatThreadHeader` to navigate to the parent message within the main message list.

## Enhancements
- Replaced the "i" icon used to open the User/Group Details page with a click interaction on `CometChatMessageHeader`, improving accessibility and simplifying the UI.

## Fixes
- None

## Removals
- Removed the "i" icon from `CometChatMessageHeader` as it has been replaced by the new header click behavior for opening the details page.

## [6.0.6] - 06-06-2025

## New
- None 

## Enhancements
- None

## Fixes
- Fixed missing space in Join Group subtitle view. (e.g., "2members" → "2 members")
- Cleaned up CSS formatting and syntax, and standardized property imports to use CometChat abstractions.

## [6.0.5] - 09-05-2025

## New 
- None

## Enhancements
- Updated the sample app to handle back button visibility using the `showBackButton` prop instead of relying on CSS for mobile view.

## Fixes
- None

## [6.0.4] - 25-04-2025

## New 
- None

## Enhancements
- None

## Fixes
- Resolved a problem where the input field remained active when the backdrop was open for password entry in password-protected groups.
- Fixed an issue where the group owner scope was not updating when a user left a password-protected group.

## [6.0.3] - 11-04-2025

## New
- None

## Enhancements
- None

## Fixes
- Fixed an issue where the info page in the React Sample App did not close after creating a new group.
- Fixed the issue where deleting a chat did not work for newly created conversations.
- Resolved the visibility issue of the transfer ownership modal on some mobile devices.
- Corrected the visibility of the "Leave group" option in the Sample App when the owner is the only member in the group.
- Resolved an issue where group options and scope were not updated for the logged-in user after transferring group ownership.

## [6.0.2] - 28-03-2025

## New
- None

## Enhancements
- None

## Fixes
- Fixed an issue where the unblock user option was not visible in Threads after blocking a user.
- Fixed an issue where an error occurred when logging in with a new user after logging out while a conversation was open.
- Addressed security vulnerabilities encountered when installing packages.

## [6.0.1] - 13-03-2025

## New
- None

## Enhancements
- None

## Fixes
 - Resolved an issue where a **group owner** lost the "Delete & Exit" and "Add Members" options after removing a member who later rejoined the group.
 - Resolved an issue where previously created group names and password suggestions appeared when creating a **new password-protected group**.

## [6.0.0] - 14-02-2025  

## New
- Added support for new languages: Italian, Japanese, Korean, Turkish, and Dutch.
- Added date localization support using `CometChatLocalize` for consistent datetime formatting.

## Enhancements
- Refactored localization handling to align with the updated `CometChatLocalization` class.

## Fixes
- None  

## Removals
- None

## Deprecations
- None 