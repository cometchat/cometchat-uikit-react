import { CometChat } from "@cometchat-pro/chat";
import { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CometChatContext } from "@cometchat-pro/react-ui-kit";
import { CometChatConstants } from "../../constants";
import { LoginSignup } from "../LoginSignup";
import { TextInput } from "../TextInput";
import { checkboxTextStyle, errorMessageStyle, formStyle, generateUidCheckboxStyle, generateUidStyle, submitBtnStyle } from "./style";

interface ISignUp {
    loggedInUser : CometChat.User | null | undefined,
    setLoggedInUser : React.Dispatch<React.SetStateAction<CometChat.User | null | undefined>>,
    setInterestingAsyncOpStarted : React.Dispatch<React.SetStateAction<boolean>>
};

export function Signup({ loggedInUser, setLoggedInUser, setInterestingAsyncOpStarted } : ISignUp) {
    const [name, setName] = useState("");
    const [uid, setUid] = useState("");
    const [generateUid, setGenerateUid] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const { theme } = useContext(CometChatContext);

    async function handleSubmit(e : React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log("Form submitted");
        let newUserUid  = uid;
        if (generateUid) {
            newUserUid = `${name.replaceAll(" ", "")}_${Date.now()}`; 
        }
        const newUser = new CometChat.User(newUserUid);
        newUser.setName(name);
        try {
            setInterestingAsyncOpStarted(true);
            const createdUser = await CometChat.createUser(newUser, CometChatConstants.authKey);
            console.log("User created:", createdUser);
            console.log(`User having uid: ${createdUser.getUid()} created successfully.`);
            setLoggedInUser(createdUser);
            // Don't think resetting states makes a difference since I am navigating to a different page
            setName("");
            setUid("");
            setGenerateUid(false);
            navigate("/home");
        }
        catch(error) {
            if (error instanceof CometChat.CometChatException && error.message) {
                setErrorMessage(error.message);
            }
            console.log(error);
        }
        finally {
            setInterestingAsyncOpStarted(false);
        }
    }

    if (loggedInUser === undefined) {
        return null;
    }

    if (loggedInUser) {
        return <Navigate to = "/home" />;
    }

    return (
        <LoginSignup
            title = "Sign Up"
        >
            <form
                onSubmit = {handleSubmit}
                style = {formStyle()}
            >
                <TextInput
                    labelText = "UID"
                    placeholderText = "Enter UID here"
                    value = {uid}
                    onValueChange = {setUid}                    
                />
                <TextInput 
                    labelText = "Name"
                    placeholderText = "Enter name here"
                    value = {name}
                    onValueChange = {setName}
                    required = {true}
                />
                <div
                    style = {generateUidStyle()}
                >
                    <input 
                        type = "checkbox"
                        checked = {generateUid}
                        onChange = {() => setGenerateUid(!generateUid)}
                        style = {generateUidCheckboxStyle()}
                    />
                    <span
                        style = {checkboxTextStyle(theme)}
                    >
                        By clicking on this checkbox, UID will be generated automatically.
                    </span>
                </div>
                <div
                    style = {errorMessageStyle(theme)}
                >
                    {errorMessage}
                </div>
                <button
                    type = "submit"
                    style = {submitBtnStyle(theme)}
                >
                    Submit
                </button>
            </form>
        </LoginSignup>
    );
}
