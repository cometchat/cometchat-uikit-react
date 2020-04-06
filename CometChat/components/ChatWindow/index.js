import React from "react";
import "./style.scss";
import SenderMessageBubble from "../SenderMessageBubble";
import ReceiverMessageBubble from "../ReceiverMessageBubble"
import SenderImageBubble from "../SenderImageBubble"
import ReceiverImageBubble from "../ReceiverImageBubble"
import SenderFileBubble from "../SenderFileBubble"
import ReceiverFileBubble from "../ReceiverFileBubble"
import SenderAudioBubble from "../SenderAudioBubble"
import ReceiverAudioBubble from "../ReceiverAudioBubble"
import SenderVideoBubble from "../SenderVideoBubble"
import ReceiverVideoBubble from "../ReceiverVideoBubble"
import { CometChatManager } from "./controller";
import { CometChat } from "@cometchat-pro/chat";
import CallMessage from "../CallMessage";



class ChatWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messageList: [],
      onItemClick: null,
      item: [],
      type: "",
      loggedInUser: {}
    }
    this.getMessagesList = this.getMessagesList.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

    this.messagesEnd = React.createRef();
  }

  componentDidMount() {
    this.scrollToBottom();
    this.cometChatManager = new CometChatManager(this.props.item, this.props.type);
    this.getMessagesList();
    this.cometChatManager.attachMessageListener(this.messageUpdated);
  }
  scrollToBottom = (scrollHeight = 0) => {
    if (this.messagesEnd) {

      this.messagesEnd.scrollTop = (this.messagesEnd.scrollHeight - scrollHeight);

    }


  }

  componentDidUpdate(prevProps, prevState) {

    if (prevState.inputMessageList !== this.state.inputMessageList) {
      this.setState({ messageList: [...this.state.messageList, ...this.state.inputMessageList] }, () => {
        this.scrollToBottom();
      });

    }

    if (prevProps.type === 'user') {
      if (prevState.item.uid !== this.state.item.uid) {
        this.cometChatManager = new CometChatManager(this.props.item, this.props.type);
        this.setState({ messageList: [] })
        this.getMessagesList();
        this.cometChatManager.attachMessageListener(this.messageUpdated);
        // this.scrollToBottom();
      }
    } else {
      if (prevProps.item.guid !== this.props.item.guid) {

        this.cometChatManager = new CometChatManager(this.props.item, this.props.type);
        this.setState({ messageList: [] })
        this.getMessagesList();
        this.cometChatManager.attachMessageListener(this.messageUpdated);
      }
    }
  }
  static getDerivedStateFromProps(nextProps, prevState) {

    if (nextProps.item !== prevState.item || nextProps.inputMessageList !== prevState.inputMessageList) {
      return nextProps;
    } else

      return null;


  }
  handleScroll(e) {
    const top = Math.round(e.currentTarget.scrollTop) === 0;
    if (top) {
      this.getMessagesList();
    }
  }

  handleClick = (message) => {
    this.props.onItemClick(message, 'message');
  }

  messageUpdated = (message, isReceipt) => {
    if (isReceipt) {
      let messageList = []
      if (message.receiptType === "delivery") {
        messageList = this.state.messageList.map(stateMessage => {
          if (message.messageId === stateMessage.id) {
            stateMessage.deliveredAt = message.deliveredAt;
          }

          return stateMessage;
        });
        this.setState({ messageList });
      } else {
        if (message.receiptType === "read") {
          messageList = this.state.messageList.map(stateMessage => {
            // if (message.messageId === stateMessage.id) {
            if (!stateMessage.readAt) {
              stateMessage.readAt = message.readAt;
            }
            // }

            return stateMessage;
          });
          this.setState({ messageList });
        }
      }
    }
    else {
      let messageList = [...this.state.messageList, message];
      this.setState({ messageList });
    }


    this.scrollToBottom();
  }
  getMessagesList() {
    this.cometChatManager.isCometChatUserLogedIn().then(
      user => {
        this.cometChatManager.fetchPreviousMessages().then(
          (messageList) => {
            messageList.map(message => {
              if (message.getSender().uid !== user.uid) {
                CometChat.markAsRead(message.id, message.getSender().getUid(), 'user');
              }
              return true
            });
            let scrollHeight = this.messagesEnd.scrollHeight;
            this.setState({ messageList: [...messageList, ...this.state.messageList], loggedInUser: user });
            this.scrollToBottom(scrollHeight);
          },
          error => {
            //TODO Handle the erros in conatct List.
            console.error("Handle the erros in conatct List", error);
          }
        );
      },
      error => {
        //TODO Handle the erros in users logedin state.
        console.error("Handle the erros in conatct List", error);
      }
    );
  }
  displayMessages() {
    if (this.state.messageList.length > 0) {
      return this.state.messageList.map((message, key) => {
        return (
          <div id={key} key={key}>
            {this.state.loggedInUser.uid === message.sender.uid ? this.handleSenderMessages(message) : this.handlereceiverMessages(message)}
          </div>
        );

      });

    }


  }
  handleSenderMessages = (message) => {
    switch (message.category) {
      case ("message"): {
        switch (message.type) {
          case ("text"):
            return <SenderMessageBubble message={message} ></SenderMessageBubble>;
          case ("image"):
            return <SenderImageBubble message={message} ></SenderImageBubble>;
          case ("file"):
            return <SenderFileBubble message={message} ></SenderFileBubble>;
          case ("audio"):
            return <SenderAudioBubble message={message} ></SenderAudioBubble>;
          case ("video"):
            return <SenderVideoBubble message={message} ></SenderVideoBubble>;
        }
      } case ("call"): {

        return <CallMessage message={message} ></CallMessage>;
      }
      default:
        return null;
    }
  }
  handlereceiverMessages = (message) => {
    switch (message.category) {
      case ("message"): {
        switch (message.category, message.type) {
          case ("message" && "text"):
            return <ReceiverMessageBubble message={message}></ReceiverMessageBubble>
          case ("message" && "image"):
            return <ReceiverImageBubble message={message} ></ReceiverImageBubble>;
          case ("message" && "file"):
            return <ReceiverFileBubble message={message} ></ReceiverFileBubble>;
          case ("message" && "audio"):
            return <ReceiverAudioBubble message={message} ></ReceiverAudioBubble>;
          case ("message" && "video"):
            return <ReceiverVideoBubble message={message} ></ReceiverVideoBubble>;
          default:
            return null;
        }
      } case ("call"): {
        return <CallMessage message={message} ></CallMessage>;
      }
    }
  }
  render() {
    return (
      <div ref={(el) => { this.messagesEnd = el; }} className="cp-chat-window" onScroll={this.handleScroll}>
        {this.displayMessages()}
      </div>
    );
  }
}



export default ChatWindow;
export const chatWindow = ChatWindow;

ChatWindow.defaultProps = {

};
