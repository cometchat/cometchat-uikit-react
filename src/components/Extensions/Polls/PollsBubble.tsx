import { useEffect, useState } from "react";
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { PollsConstants } from './PollsConstants';
import { CometChatAvatar } from "../../BaseComponents/CometChatAvatar/CometChatAvatar";
import { CometChatRadioButton } from "../../BaseComponents/CometChatRadioButton/CometChatRadioButton";
import { MessageBubbleAlignment } from "../../../Enums/Enums";

export interface PollOptions {
  id: string;
  selectedByLoggedInUser?: boolean;
  text: string;
  votersObj?: CometChat.User[];
  count: number;
  percent: string;
}

interface PollsBubbleProps {
  /** 
   * Array of options for the poll.
   */
  options?: PollOptions[];

  /** 
   * The question being asked in the poll.
   */
  pollQuestion: string;

  /** 
   * The unique identifier for the poll.
   */
  pollId: string | number;

  /** 
   * The currently logged-in user.
   * Optional.
   */
  loggedInUser: CometChat.User | undefined;

  /** 
   * The unique identifier of the sender of the poll.
   */
  senderUid: string;

  /** 
   * Optional metadata associated with the poll.
   */
  metadata?: any;
  /** 
   * ALignemtn of the message bubble
   */
  alignment?: MessageBubbleAlignment;

}

/**
 * Default props for the PollsBubble component.
 *
 * @type {Partial<PollsBubbleProps>}
 */
const defaultProps: Partial<PollsBubbleProps> = {
  options: [],
  pollQuestion: "",
  pollId: "",
  loggedInUser: undefined,
  senderUid: "",
  metadata: {},
  alignment: MessageBubbleAlignment.right,
};

/**
 * PollsBubble component that displays a poll question and options.
 *
 * @param {PollsBubbleProps} props - The props for the component.
 * @returns {JSX.Element} The rendered PollsBubble component.
 */
const PollsBubble = (props: PollsBubbleProps) => {
  const {
    options,
    pollQuestion,
    pollId,
    loggedInUser,
    senderUid,
    metadata,
    alignment,
  } = { ...defaultProps, ...props };

  const isSentByMe = !senderUid || loggedInUser?.getUid() === senderUid


  const [pollOptions, setPollOptions] = useState<PollOptions[]>([]);

  useEffect(() => {
    if (metadata) {
      const pollsData = metadata[PollsConstants.injected]?.extensions?.polls || {};
      const totalVotes = pollsData?.results?.total || 0;
      const optionKeys = Object.keys(pollsData?.options || {});
      const optionList = optionKeys.map((currentItem) => {
        const optionData = pollsData?.results?.options[currentItem];
        const vote = optionData?.count || 0;
        const calculatedPercent = totalVotes > 0 ? Math.round((vote / totalVotes) * 100) : 0;
        const selectedByLoggedInUser = optionData?.voters?.hasOwnProperty(loggedInUser?.getUid()) || false;
        const votersObj = pollsData?.results.options[Number(currentItem)].voters ? Object.values(pollsData?.results.options[Number(currentItem)].voters).slice(0, 3).map((v: any) => v) : [];
        return {
          id: currentItem,
          percent: `${calculatedPercent}%`,
          text: pollsData?.options[currentItem],
          selectedByLoggedInUser,
          votersObj: votersObj,
          count: vote
        };
      });
      setPollOptions(options && options.length > 0 ? options : optionList);
    }
  }, [metadata, options, loggedInUser?.getUid()]);

  /**
   * Handles the voting action for the poll.
   *
   * @param {PollOptions} selectedOption - The option selected by the user.
   */
  const answerPollQuestion = (selectedOption: PollOptions) => {
    CometChat.callExtension(PollsConstants.polls, PollsConstants.post, PollsConstants.v2_vote, {
      vote: selectedOption.id,
      id: pollId,
    }).catch(console.error);
  };
 function getId(id:string | number){
  let time = new Date().getTime();
  return time + String(id);
 }
  return (
    <div className="cometchat">
      <div className={`cometchat-polls-bubble ${alignment == MessageBubbleAlignment.left ? "cometchat-polls-bubble-incoming" : "cometchat-polls-bubble-outgoing"} `}>
        <div
          className="cometchat-polls-bubble__question"
        >
          {pollQuestion}
        </div>
        <ul className="cometchat-polls-bubble__options">
          {pollOptions.map((option) => (
            <li
              key={option.id}
              onClick={() => answerPollQuestion(option)}
              className="cometchat-polls-bubble__option-item">
              <div className="cometchat-poll-bubble__option-item-leading-view">
                <CometChatRadioButton
                  name={getId(pollId)}
                  id={getId(option.id)}
                  checked={option.selectedByLoggedInUser ? true : false} />
              </div>

              <div
                className="cometchat-poll-bubble__option-item-body"
              >
                <div
                  className="cometchat-poll-bubble__option-item-body-content"
                >
                  <div
                    className="cometchat-poll-bubble__option-item-body-content-title"
                  >{option.text}</div>
                  <div
                    className="cometchat-poll-bubble__option-item-body-content-tail"
                  >

                    <div
                      style={{ display: "flex" }}>
                      {

                        option?.votersObj && option?.votersObj.map(
                          (user: any, index: number) => {

                            const { name, avatar } = user;
                            let isLastIndex = index == option?.votersObj!.length - 1

                            return (
                              <div
                                className={`cometchat-poll-bubble__option-item-body-content-tail-avatar ${isLastIndex ? "last" : ""}`}
                                key={index}
                                style={{
                                  zIndex: index,
                                }}
                              >
                                <CometChatAvatar name={name} image={avatar} />
                              </div>
                            );
                          })}
                    </div>
                    <div
                      className="cometchat-poll-bubble__option-item-body-content-tail-count"
                    >
                      {option.count}
                    </div>
                  </div>
                </div>
                <div
                  className="cometchat-poll-bubble__option-item-body-progress"
                >
                  <div
                    className="cometchat-poll-bubble__option-item-body-progress-background"
                    style={{ width: option.percent }}
                  ></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export { PollsBubble };