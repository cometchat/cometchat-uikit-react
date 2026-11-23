# v7.3.0

## New
- Offline support (off by default). Turn it on with `UIKitSettingsBuilder.setOfflineConfig()` (needs Chat SDK JavaScript 4.3.1 or later; the peer dependency stays `^4.2.0`, and with an older SDK — 4.3.0 included — offline stays off). With it on, the lists show what was saved on the device first and then the server's copy; messages sent offline wait with "Not sent yet" and go out on reconnect, with Retry and Delete on any message not sent; media saved on the device plays offline; and on reconnect the lists catch up from the SDK instead of reloading. A list with nothing to show offline says so: "Connect to load chats / users / groups / members / messages / reactions / notifications" (an icon and one line, no Retry; your own `errorView` replaces it) and calls `onError` once, and a keyword search says "Connect to search" with "Search needs an internet connection." (your own `emptyView` replaces it, no `onError`); each loads again by itself on reconnect. A failed load for any other reason shows the error view and calls `onError`. Lists that already show rows keep them: offline is silent, and a real error calls `onError` only for a load you or your app started. In the message list and threads, an edge that stopped at "Connect to load more" loads its page by itself on reconnect. Nobody shows online while the connection is down, in lists, headers or screen-reader labels.
- `hideOfflineNotices` prop on `CometChatMessageList` and `CometChatConversations`, to hide the offline notices.
- `ui:message/send-state-changed` and `ui:offline/cache-reset` UI events (never emitted with offline off). If you `switch` over every `CometChatEvent` type, add a `default` case.
- New `OFFLINE_*` members of the exported `CometChatMessageListAction` union (`OFFLINE_UPSERT`, `OFFLINE_SERVER_PAGE`, `OFFLINE_PAGE_ERROR`, `OFFLINE_REMOVE`, `OFFLINE_TOUCH`, `OFFLINE_REPLACE_ALL`, `OFFLINE_SET_JUMP_TO_LATEST`, `OFFLINE_AROUND_START`, `OFFLINE_CONNECTED`). Code that switches over every action with an exhaustive `never` check needs a `default` case.
- CSS variables for the offline states (retry link, failed icon and tint, "Connect to load more" footer, notices, unavailable media), each falling back to today's look.
- With offline on, the Promise of `CometChatUIKit.sendTextMessage`, `sendMediaMessage` and `sendCustomMessage` now rejects once, with `ERROR_OFFLINE_MESSAGE_DISCARDED`, when the message is removed — the session ends (logout or user switch), a cache reset loses the unsent message, your user deletes the unsent row, or the outbox discards it — instead of staying pending. The rejection's `message` is a sentence and the message it is about is on the error as `sentMessage`. The kit shows no error for it; add a `.catch` if you await these calls. With offline off nothing changes.
- Shipping offline support grows the kit: its gzipped entry budget moves from 674 kB to 724 kB (about 7%) and the offline hub now starts with `CometChatUIKit.init()` whatever the offline state — its SDK listeners are inert while offline is off, and none are registered below Chat SDK 4.3.1 — so apps that leave offline off carry the code and that registration too.

## Enhancements
- `role` prop on `CometChatListItem` (`option` by default, or `group`).
- `data-cc` and `data-cc-*` attributes on message rows, conversation rows, notices, the list footer, the composer input and the empty and error views, for test automation. DOM snapshot tests may change.

## Fixes
- Fixed a message list that is empty when the connection returns staying blank; it now loads again.
- Fixed messages missed during an outage never loading when the newest message had not been acknowledged yet.
- Fixed duplicate conversation rows after paging past a conversation that received a message.
- Fixed a message you just sent showing twice in the message list when a fetch brought the server's copy back while the row that was still waiting for its acknowledgement was on screen. The two are now one row, matched on the message's client id. This happens on a slow or flaky connection with offline off as well.
- Fixed a message list left mounted across a user switch loading the new user's chat with themselves. It now stays cleared until your app points it at a chat for the user who signed in.
- Fixed a `messagesRequestBuilder` passed to `CometChatMessageList` or `CometChatSavedMessages` being modified.
- Fixed saved message rows being announced by screen readers as selectable options.
- Fixed voice notes showing "Failed to load audio" with offline on and media caching `AUTO` (the default), for the sender and the receiver, after a reload and offline. The player now starts fresh when the cached copy replaces the file's URL, and a load cancelled by that swap no longer marks it as failed.

# v7.2.6

## New
- None

## Enhancements
- Enhanced End to End and Unit test cases to improve test reliability and coverage, particularly for message threads.

## Fixes
- None

# v7.2.5

## New
- None

## Enhancements
- None

## Fixes
- Fixed voice notes recorded on the web not playing on iOS and showing 0:00 on mobile; they're now sent as WAV with their length in `audioDuration` metadata.
- Fixed replies sent as voice notes losing their quote and showing "Edited" after the Voice Transcription extension processed them.
- Fixed polls created as replies not quoting the message and leaving the reply preview open.
