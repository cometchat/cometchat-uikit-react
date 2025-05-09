/**
 * A variable to hold the CometChat UIKit Calls instance.
 * 
 * This variable is initially set to `null` and can be assigned to an instance
 * of CometChat UIKit Calls or any relevant object as needed.
 * 
 * @type {any}
 */
var callsSDK: any = null;
try{
    callsSDK = require('@cometchat/calls-sdk-javascript');
}catch(e){
    
}

export var CometChatUIKitCalls: any = callsSDK?.CometChatCalls;
