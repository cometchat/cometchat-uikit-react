import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { CometChatTheme } from "@cometchat-pro/react-ui-kit";
import * as styles from "./Styles";
import buttonImage from "../assets/ButtonBackground/button-opc.png";
import backgroundImage from "../assets/Background/Image-518@1x.png";
import { COMETCHAT_CONSTANTS } from "../../consts";
import { CometChat } from "@cometchat-pro/chat";

export const Signup = (props) => {

    const [userName, setUserName] = useState("");
    const [userUID, setUserUID] = useState("");
    const [generateUID, setGenerateUID] = useState(false);
    const [error, setError] = useState(null);
    const theme = new CometChatTheme({});

    let history = useHistory();

    const consoleInput = (e) => {
        if (e.target?.checked) {
            setGenerateUID(true);
        } else {
            setGenerateUID(false);
        }
    }

    const loginToDashboard = (id) => {
        CometChat.login(id, COMETCHAT_CONSTANTS.AUTH_KEY).then((user) => {
            if (user) {
                props.setLoggedInUser(user)
                history.replace("/home");
            }
        }).catch(error => {
            console.log('CometChatLogin Failed', error);
            setError(error?.message)
        });
    }

    const createUser = (username, UID) => {
        let uid = '';
        setError("")
        let authKey = COMETCHAT_CONSTANTS.AUTH_KEY;
        if (generateUID) {
            uid = username + Math.round(new Date() / 1000)
        }
        else {
            uid = UID;
        }
        let name = username;
        let user = new CometChat.User(uid);
        user?.setName(name);
        CometChat.createUser(user, authKey).then(
            (user) => {
                loginToDashboard(user?.getUid())
            }, error => {
                setError(error?.message)
            }
        )
    }

    return (
        <div className="signup__wrapper" style={styles.loginWrapperStyle(theme)}>
            <div className="signup__page">
                <div className="header__section" style={styles.headerSectionStyle(theme)}>
                    <div className="header__title" style={styles.headerTitleStyle(theme)}>comet<b>chat</b></div>
                    <div className="release-tag" style={styles.headerSubtitleStyle(theme)} > v.1.0 - beta1</div>
                </div>
                <div className="content__section">
                    <div className="left__content">
                        <div className="content__title" style={styles.titleStyle(theme)}>
                            Sign Up
                        </div>
                        <div className="signup__container" style={styles.containerStyle(theme)}>

                            <div className="signup__field">

                                <div className="uid__field">
                                    <label htmlFor="uid" style={styles.loginMessageStyle(theme)}>UID</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter UID Here" 
                                        style={styles.inputStyle(theme)} 
                                        name="uid" 
                                        disabled={generateUID} 
                                        value={userUID}
                                        onChange={e => setUserUID(e.target?.value)}
                                    />
                                </div>
                                <div className="name__field">
                                    <label htmlFor="name" style={styles.loginMessageStyle(theme)}>Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter Name here" 
                                        style={styles.inputStyle(theme)} 
                                        name="name" 
                                        value={userName}
                                        onChange={e => setUserName(e.target?.value)}
                                    />
                                </div>
                                <div className="uid__generator">

                                    <label style={styles.loginMessageStyle(theme)} className="checkbox__container">By clicking on this checkbox, UID will be generated automatically.
                                        <input type="checkbox" onChange={(e) => consoleInput(e)} />
                                        <span className="checkmark"></span>
                                    </label>


                                </div>
                                <div className="error__text" style={styles.errorTextStyle(theme)}>
                                    {error}
                                </div>
                            </div>
                            <div className="signup__section">

                                <button className="signup__button" style={styles.signupButtonStyle(theme, buttonImage)} onClick={() => createUser(userName, userUID)}>Submit</button>
                            </div>
                        </div>
                    </div>
                    <div className="right__content" style={styles.sectionImageStyle(backgroundImage)} ></div>
                </div>
                <div className="footer__section"> <footer style={styles.footerStyle(theme)}> {new Date().getFullYear()} &copy; CometChat </footer></div>
            </div>
        </div>
    )
}