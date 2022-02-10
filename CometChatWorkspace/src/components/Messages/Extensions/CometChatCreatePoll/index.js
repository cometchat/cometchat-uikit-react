import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { localize } from "../../../";
import { CometChatMessageTypes, CometChatCustomMessageTypes, CometChatMessageReceiverType } from "../";

import { Hooks } from "./hooks";
import { CometChatCreatePollOptions } from "../";

import {
    modalWrapperStyle,
    modalCloseStyle,
    modalBodyStyle,
    modalErrorStyle,
    modalTableStyle,
    tableCaptionStyle,
    tableBodyStyle,
    tableFootStyle,
    iconWrapperStyle,
    addOptionIconStyle
} from "./style";

import creatingIcon from "./resources/creating.svg";
import addIcon from "./resources/add-circle-filled.svg";
import clearIcon from "./resources/close.svg";

const CometChatCreatePoll = props => {

    const [loggedInUser, setLoggedInUser] = React.useState(null);
	const [chatWith, setChatWith] = React.useState(null);
	const [chatWithId, setChatWithId] = React.useState(null);

    const [pollOptions, setPollOptions] = React.useState([]);
    const [error, setError] = React.useState(null);
    const [isCreating, setIsCreating] = React.useState(false);

    const questionRef = React.createRef();
    const optionOneRef = React.createRef();
    const optionTwoRef = React.createRef();
    const optionRef = React.createRef();
    const chatRef = React.useRef(chatWith);

    const addPollOption = () => {

        const options = [...pollOptions];
        options.push({ value: "", id: new Date().getTime() });
        setPollOptions(options);
    };

    const  removePollOption = option => {

        const options = [...pollOptions];
        const optionKey = options.findIndex(opt => opt.id === option.id);
        if (optionKey > -1) {
            options.splice(optionKey, 1);
            setPollOptions(options);
        }
    };

    const optionChangeHandler = (event, option) => {

        const options = [...pollOptions];
        const optionKey = options.findIndex(opt => opt.id === option.id); 
        if (optionKey > -1) {

            const newOption = { ...option, value: event.target.value}
            options.splice(optionKey, 1, newOption);
            setPollOptions(options);
        }
    }

    const createPoll = () => {

        const question = questionRef.current.value.trim();
        const firstOption = optionOneRef.current.value.trim();
        const secondOption = optionTwoRef.current.value.trim();
        const optionItems = [firstOption, secondOption];

        if (question.length === 0) {
            setError(localize("INVALID_POLL_QUESTION"));
            return false;
        }

        if (firstOption.length === 0 || secondOption.length === 0) {
            setError(localize("INVALID_POLL_OPTION"));
            return false;
        }

        pollOptions.forEach(function (option) {
            optionItems.push(option.value);
        });

        setIsCreating(true);
        setError(localize(""));

        CometChat.callExtension("polls", "POST", "v2/create", {
            question: question,
            options: optionItems,
            receiver: chatWithId,
            receiverType: chatWith,
        })
        .then(response => {
            if (response && response.hasOwnProperty("success") && response["success"] === true) {
                
                setIsCreating(false);
                props.onSubmit();
                //this.props.actionGenerated(enums.ACTIONS["POLL_CREATED"]);
                
            } else {
                setError(localize("SOMETHING_WRONG"));
            }
        })
        .catch(error => {
            setIsCreating(false);
            setError(localize("SOMETHING_WRONG"));
        });
    };

    Hooks(props, setLoggedInUser, setChatWith, setChatWithId, chatRef);


    const optionList = [...pollOptions];
    const pollOptionView = optionList.map((option, index) => {
        return (
            <CometChatCreatePollOptions 
            key={index} 
            option={option} 
            tabIndex={index+4}
            optionChangeHandler={optionChangeHandler}
            removePollOption={removePollOption} />
        );
    });

    const createText = isCreating ? localize("CREATING") : localize("CREATE");

    return (
        <div style={modalWrapperStyle()} className="modal__createpoll">
            <span style={modalCloseStyle(clearIcon)} className="modal__close" onClick={props.onClose} title={localize("CLOSE")}></span>
            <div style={modalBodyStyle()} className="modal__body">
                <table style={modalTableStyle()}>
                    <caption style={tableCaptionStyle()} className="modal__title">
                        {localize("CREATE_POLL")}
                    </caption>
                    <tbody style={tableBodyStyle()}>
                        <tr className="error">
                            <td colSpan="3">
                                <div style={modalErrorStyle()}>{error}</div>
                            </td>
                        </tr>
                        <tr className="poll__question">
                            <td>
                                <label>{localize("QUESTION")}</label>
                            </td>
                            <td colSpan="2">
                                <input type="text" autoFocus tabIndex="1" placeholder={localize("ENTER_YOUR_QUESTION")} ref={questionRef} />
                            </td>
                        </tr>
                        <tr className="poll__options">
                            <td>
                                <label>{localize("OPTIONS")}</label>
                            </td>
                            <td colSpan="2">
                                <input type="text" tabIndex="2" placeholder={localize("ENTER_YOUR_OPTION")} ref={optionOneRef} />
                            </td>
                        </tr>
                        <tr ref={optionRef} className="poll__options">
                            <td>&nbsp;</td>
                            <td colSpan="2">
                                <input type="text" tabIndex="3" placeholder={localize("ENTER_YOUR_OPTION")} ref={optionTwoRef} />
                            </td>
                        </tr>
                        {pollOptionView}
                        <tr>
                            <td>&nbsp;</td>
                            <td>
                                <label>{localize("ADD_NEW_OPTION")}</label>
                            </td>
                            <td style={iconWrapperStyle()}>
                                <i tabIndex="100" style={addOptionIconStyle(addIcon)} className="option__add" onClick={addPollOption}></i>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot style={tableFootStyle(isCreating, creatingIcon)}>
                        <tr className="createpoll">
                            <td colSpan="2">
                                <button type="button" onClick={createPoll}>
                                    <span>{createText}</span>
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export { CometChatCreatePoll };