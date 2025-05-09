import { JSX } from "react";

export class OutgoingCallConfiguration {
  disableSoundForCalls?: boolean = false;
  customSoundForCalls?: string;
  titleView?: (call: CometChat.Call) => JSX.Element;
  subtitleView?: (call: CometChat.Call) => JSX.Element;
  avatarView?: (call: CometChat.Call) => JSX.Element;
  cancelButtonView?: (call: CometChat.Call) => JSX.Element;
  onError?: (error: CometChat.CometChatException) => void;
  onCallCanceled?: Function;
  constructor(configuration: OutgoingCallConfiguration) {
    this.disableSoundForCalls = configuration?.disableSoundForCalls;
    this.onError = configuration?.onError;
    this.onCallCanceled = configuration?.onCallCanceled;
    this.titleView = configuration?.titleView;
    this.subtitleView = configuration?.subtitleView;
    this.avatarView = configuration?.avatarView;
    this.cancelButtonView = configuration?.cancelButtonView;
  }
}
