import { Subject } from "rxjs";
import { MouseEventSource, PanelAlignment } from "../Enums/Enums";
import { ComposerId } from "../utils/MessagesDataSource";
/**
 * UI event subjects for handling various UI-related actions (e.g., showing panels, modals, dialogs, etc.)

 */

export class CometChatUIEvents {
  static ccHidePanel: Subject<PanelAlignment | void> =
    new Subject<PanelAlignment | void>();
  static ccShowPanel: Subject<IPanel> = new Subject<IPanel>();
  static ccShowModal: Subject<IModal> = new Subject<IModal>();
  static ccHideModal: Subject<void> = new Subject<void>();
  static ccShowDialog: Subject<IDialog> = new Subject<IDialog>();
  static ccHideDialog: Subject<void> = new Subject<void>();
  static ccActiveChatChanged: Subject<IActiveChatChanged> =
    new Subject<IActiveChatChanged>();
  static ccShowOngoingCall: Subject<IShowOngoingCall> =
    new Subject<IShowOngoingCall>();
  static ccOpenChat: Subject<IOpenChat> = new Subject<IOpenChat>();
  static ccComposeMessage: Subject<string> = new Subject<string>();
  static ccMouseEvent: Subject<IMouseEvent> = new Subject<IMouseEvent>();
  static ccShowMentionsCountWarning: Subject<IMentionsCountWarning> =
    new Subject<IMentionsCountWarning>();
    static ccActivePopover: Subject<string> = new Subject<string>();
  /**
   * Emitted when a card element action is triggered (developer cards and nested
   * agent cards). The UI Kit forwards the raw action only — it performs no
   * action behavior. Apps subscribe to handle the 9 renderer action types.
   */
  static ccCardActionClicked: Subject<ICardActionClicked> =
    new Subject<ICardActionClicked>();

}

/**
 * Payload for {@link CometChatUIEvents.ccCardActionClicked}.
 * `action` is the raw action object emitted by the card renderer
 * (`@cometchat/cards-react`); the kit never interprets it.
 */
export interface ICardActionClicked {
  message: CometChat.BaseMessage;
  action: any;
}

/**
* Interface for ui-related events
*/
export interface IOpenChat {
  user?: CometChat.User;
  group?: CometChat.Group;
}
export interface IShowOngoingCall {
  child: any;
  message?: CometChat.CustomMessage;
}
export interface IPanel {
  child?: any;
  configuration?: any;
  message?: CometChat.BaseMessage;
  position?: PanelAlignment;
  composerId?:ComposerId;
}
export interface IModal {
  child?: any;
  composerId?:ComposerId
}
export interface IActiveChatChanged {
  user?: CometChat.User;
  group?: CometChat.Group;
  message?: CometChat.BaseMessage;
  unreadMessageCount?: number;
}
export interface IDialog {
  child: any;
  confirmCallback: any;
}

export interface IMouseEvent {
  event: Event;

  source: MouseEventSource;

  body?: {};
}

export interface IMentionsCountWarning {
  showWarning: boolean;
  id?: string;
}
