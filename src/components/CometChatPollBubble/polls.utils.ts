/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * Poll utility functions.
 * Extracts and processes poll data from CometChat message metadata.
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatPollData,
  CometChatPollBubbleOption,
  CometChatPollVoterInfo,
} from './CometChatPollBubble.types';
import { POLLS_CONSTANTS } from '../../constants/CometChatExtensionConstants';

/**
 * Extract poll data from a CustomMessage's metadata.
 * Path: metadata["@injected"]["extensions"]["polls"]
 */
export function extractPollData(
  message: CometChat.CustomMessage | null | undefined
): CometChatPollData | null {
  if (!message) return null;

  try {
    const metadata = message.getMetadata() as Record<string, unknown> | null;
    if (!metadata) return null;

    const injected = metadata[POLLS_CONSTANTS.injectedKey] as Record<string, unknown> | undefined;
    if (!injected) return null;

    const extensions = injected[POLLS_CONSTANTS.extensionsKey] as
      | Record<string, unknown>
      | undefined;
    if (!extensions) return null;

    const pollsData = extensions[POLLS_CONSTANTS.pollsKey] as Record<string, unknown> | undefined;
    if (!pollsData) return null;

    return {
      id: (pollsData.id as string | number) || message.getId(),
      question: (pollsData.question as string) || '',
      options: (pollsData.options as Record<string, string>) || {},
      results: (pollsData.results as CometChatPollData['results']) || { total: 0, options: {} },
    };
  } catch {
    return null;
  }
}

/**
 * Process raw poll data into display-ready poll options.
 */
export function processPollOptions(
  pollData: CometChatPollData,
  loggedInUserUid?: string
): CometChatPollBubbleOption[] {
  const totalVotes = pollData.results.total || 0;
  const optionKeys = Object.keys(pollData.options);

  return optionKeys.map(optionId => {
    const optionResult = pollData.results.options[optionId];
    const voteCount = optionResult?.count ?? 0;
    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

    const selectedByLoggedInUser = loggedInUserUid
      ? Object.prototype.hasOwnProperty.call(optionResult?.voters ?? {}, loggedInUserUid)
      : false;

    const voters: CometChatPollVoterInfo[] = optionResult?.voters
      ? Object.values(optionResult.voters).slice(0, 3)
      : [];

    return {
      id: optionId,
      text: pollData.options[optionId] ?? '',
      count: voteCount,
      percent: `${String(percentage)}%`,
      selectedByLoggedInUser,
      voters,
    };
  });
}
