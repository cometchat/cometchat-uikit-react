export declare function isSentByMe(call: any, loggedInUser: CometChat.User): boolean;
export declare function isMissedCall(call: CometChat.Call, loggedInUser: CometChat.User): boolean;
export declare function verifyCallUser(call: any, loggedInUser: CometChat.User): any;
export declare function getCallStatusWithType(call: any, loggedInUser: CometChat.User, includeType?: boolean): string;
export declare function convertMinutesToHoursMinutesSeconds(minutes: number): string;
export declare function convertSecondsToHoursMinutesSeconds(seconds: number): string;
export declare function downloadRecordingFromURL(url: string): void;
