## [5.0.6] - 11-04-2025

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

## [5.0.5] - 28-03-2025

## New
- None

## Enhancements
- None

## Fixes
- Fixed an issue where the unblock user option was not visible in Threads after blocking a user.
- Fixed an issue where an error occurred when logging in with a new user after logging out while a conversation was open.
- Addressed security vulnerabilities encountered when installing packages.

## [5.0.4] - 13-03-2025

## New
- None

## Enhancements
- None

## Fixes
 - Resolved an issue where a **group owner** lost the "Delete & Exit" and "Add Members" options after removing a member who later rejoined the group.
 - Resolved an issue where previously created group names and password suggestions appeared when creating a **new password-protected group**.

## [5.0.3] - 13-02-2025

## New
- None

## Enhancements
- None

## Fixes
- Fixed a visibility issue where the `Unblock` button was displayed to the logged-in user even when they were blocked by the other user.

## [5.0.2] - 30-01-2025

## New
- None

## Enhancements
- None

## Fixes
- Fixed an issue where clicking on a mentioned user did not redirect to their message screen.
- Fixed an issue where a newly added group member's avatar was not displayed in the Group Member View.
- Resolved an issue where the group details component re-rendered unexpectedly after each operation.
- Corrected the position of the profile info popup in mobile view to improve the user experience on smaller screens.

## [5.0.1] - 13-01-2025

#### New
- None  

#### Enhancements
- None  

#### Fixes
- Removed unused dependencies to improve application performance and reduce build size.  
- Adjusted the minimum width of the sidebar and tabs to ensure proper layout rendering when the sample app is displayed within fixed-width containers.  
- Resolved a flickering issue on the **Banned Member** page when clicking the "Banned Member" option, ensuring a smoother user experience.  

## [5.0.0] - 03-01-2025

### New
- None

### Enhancements
- Updated CometChat React UI Kit version to v5.0.0

### Fixes
- Fixed an issue where the empty state in the Group Members component was not fully visible.
- Fixed an issue where the Transfer Ownership prompt incorrectly appeared when attempting to leave a group with only one member.
- Fixed an issue where the selected call log was not highlighted as active in the call logs list.
- Fixed an issue where the unban option was not visible in the Banned Members View.
- Fixed an issue where the avatar in Outgoing call was not proper when a call is initiated via Call log detail.

## [5.0.0-beta2] - 10-12-2024

### New
- Introduced a feature to seamlessly open a user's conversation by clicking on their mention.

### Enhancements
- Updated the incoming call icon in Call History component.
- Refined the group listing in new conversations to display only the groups the logged-in user is a member of.

### Fixes
- Resolved an issue where the Details component did not open with the correct width in iPad browsers.
- Fixed an issue where unblocking a user from the composer did not update the "Unblock User" menu to "Block User" in the user details.