/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../constants/CometChatUIKitConstants';

/**
 * CometChatUIKitUtility — utility class providing helper methods
 * such as deep cloning, ID generation, and Unix timestamp retrieval.
 *
 */

/**
 * Creates a deep copy of the value provided.
 *
 * @remarks
 * This function cannot copy truly private properties (those that start with a "#" symbol inside a class block).
 * Functions are copied by reference and additional properties on array objects are ignored.
 *
 * @param arg - Any value
 * @returns A deep copy of `arg`
 */
export function clone<T>(arg: T): T {
  if (typeof arg !== 'object' || !arg) {
    return arg;
  }

  let res: any;

  if (Array.isArray(arg)) {
    res = [];
    for (const value of arg) {
      res.push(clone(value));
    }
    return res as T;
  } else {
    res = {};
    const descriptor = Object.getOwnPropertyDescriptors(arg);
    for (const k of Reflect.ownKeys(descriptor)) {
      const curDescriptor = descriptor[k as string];
      if (!curDescriptor) continue;

      if (Object.prototype.hasOwnProperty.call(curDescriptor, 'value')) {
        Object.defineProperty(res, k, {
          ...curDescriptor,
          value: clone(curDescriptor.value),
        });
      } else {
        Object.defineProperty(res, k, curDescriptor);
      }
    }
    Object.setPrototypeOf(res, Object.getPrototypeOf(arg));
  }

  return res as T;
}

/**
 * Generates a unique ID.
 * @returns A unique string identifier.
 */
export function generateId(): string {
  return '_' + Math.random().toString(36).slice(2, 11);
}

/**
 * Retrieves the current Unix timestamp (seconds).
 * @returns The Unix timestamp.
 */
export function getUnixTimestamp(): number {
  return Math.round(+new Date() / 1000);
}

/**
 * Creates a CometChat.Action message for group member actions.
 *
 * @param actionOn - The group member the action is performed on
 * @param action - The action string (e.g., 'kicked', 'banned', 'added', 'scopeChanged')
 * @param group - The group where the action occurred
 * @param loggedInUser - The user performing the action
 * @returns A properly constructed CometChat.Action message
 */
export function createActionMessage(
  actionOn: CometChat.GroupMember | CometChat.User,
  action: string,
  group: CometChat.Group,
  loggedInUser: CometChat.User
): CometChat.Action {
  const actionMessage = new CometChat.Action(
    group.getGuid(),
    CometChatUIKitConstants.MessageTypes.groupMember,
    CometChatUIKitConstants.MessageReceiverType.group,
    CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
  );
  actionMessage.setAction(action);
  actionMessage.setActionBy(clone(loggedInUser));
  actionMessage.setSender(clone(loggedInUser));
  actionMessage.setMessage(`${loggedInUser.getName()} ${action} ${actionOn.getName()}`);
  actionMessage.setActionFor(clone(group));
  actionMessage.setActionOn(clone(actionOn));
  actionMessage.setReceiver(clone(group));
  actionMessage.setConversationId('group_' + group.getGuid());
  actionMessage.setMuid(generateId());
  actionMessage.setSentAt(getUnixTimestamp());
  actionMessage.setReceiverType(CometChatUIKitConstants.MessageReceiverType.group);
  if ('getScope' in actionOn) {
    actionMessage.setData({
      extras: {
        scope: {
          new: actionOn.getScope(),
        },
      },
    });
  }
  return actionMessage;
}

export const CometChatUIKitUtility = {
  clone,
  ID: generateId,
  getUnixTimestamp,
  createActionMessage,
};
