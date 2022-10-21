import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { CometChatAvatar, CometChatTheme } from "@cometchat-pro/react-ui-kit";
import * as styles from "./Styles";
import buttonImage from "../assets/ButtonBackground/button-opc.png";
import backgroundImage from "../assets/Background/Image-518@1x.png";
import { CometChat } from "@cometchat-pro/chat";
import { COMETCHAT_CONSTANTS } from "../../consts";

export const Login = (props) => {

    const avatarStyles = {
        height: "32px",
        width: "32px",
        backgroundColor: "white",
        borderRadius: "24px"
    }

    const usersArray = [
        {
            name: "Iron Man",
            uid: "superhero1",
            avatar: "https://data-us.cometchat.io/assets/images/avatars/ironman.png"
        },
        {
            name: "Captain America",
            uid: "superhero2",
            avatar: "https://data-us.cometchat.io/assets/images/avatars/captainamerica.png"
        },
        {
            name: "Spiderman",
            uid: "superhero3",
            avatar: "https://data-us.cometchat.io/assets/images/avatars/spiderman.png"
        },
        {
            name: "Wolvorine",
            uid: "superhero4",
            avatar: "https://data-us.cometchat.io/assets/images/avatars/wolverine.png"
        }
    ]

    const [uid, setUid] = useState("");
    const [error, setError] = useState(null);
    const theme = new CometChatTheme({});

    let history = useHistory();


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

    return (
        <div className="login__wrapper" style={styles.loginWrapperStyle(theme)}>
            <div className="login__page">
                <div className="header__section" style={styles.headerSectionStyle(theme)}>
                    <div className="header__title" style={styles.headerTitleStyle(theme)}>comet<b>chat</b></div>
                    <div className="release-tag" style={styles.headerSubtitleStyle(theme)}> v.1.0 - beta1</div>
                </div>
                <div className="content__title" style={styles.titleStyle(theme)}>
                    Login to Your <br /> Account
                </div>
                <div className="content__section">
                    <div className="left__content">
                        <div className="login__container" style={styles.containerStyle(theme)}>
                            <div className="sample__login">
                                <span className="login__header" style={styles.subtitleStyle(theme)}>
                                    Using our sample users
                                </span>
                                <div className="sample__users">
                                    {
                                        usersArray?.map((user, userKey) => {
                                            return (
                                                <div key={userKey} className="cards" style={styles.userDetailsStyle(theme, buttonImage)} onClick={() => { loginToDashboard(user?.uid) }}>
                                                    <div className="avatar">
                                                        <CometChatAvatar
                                                            name={user?.name}
                                                            image={user?.avatar}
                                                            style={{
                                                                backgroundColor: avatarStyles?.backgroundColor,
                                                                height: avatarStyles?.height,
                                                                width: avatarStyles?.width,
                                                                borderRadius: avatarStyles?.borderRadius
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="user__details">
                                                        <div className="user__name" style={styles.usernameStyle(theme)}> {user?.name} </div>
                                                        <div className="user__uid" style={styles.useruidStyle(theme)}>{user?.uid}</div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }

                                </div>
                            </div>
                            <div className="error__text" style={styles.errorTextStyle(theme)}>
                                {error}
                            </div>
                            <div className="login__field" style={styles.borderStyle(theme)}>
                                <span className="login__message" style={styles.loginMessageStyle(theme)}> Or else continue with login using UID</span>
                                <input
                                    type="text"
                                    placeholder="Enter UID Here"
                                    style={styles.inputStyle(theme)}
                                    value={uid}
                                    onChange={(e) => setUid(e.target.value)}
                                />
                                <button style={styles.buttonStyle(theme, buttonImage)} className="login__button" onClick={() => loginToDashboard(uid)}> Login</button>
                            </div>
                            <div className="signup__section">
                                <div className="signup__text" style={styles.subtitleStyle(theme)}>Don't have an account?</div>
                                <Link to="/signup"><button className="signup__button" style={styles.signupButtonStyle(theme)}> Sign Up</button></Link>
                            </div>
                        </div>
                    </div>
                    <div className="right__content" style={styles.sectionImageStyle(backgroundImage)}></div>
                </div>
                <div className="footer__section">
                    <footer style={styles.footerStyle(theme)}>{new Date().getFullYear()} &copy; CometChat </footer>
                </div>
            </div>
        </div>
    )
}