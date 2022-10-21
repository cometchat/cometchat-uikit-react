import * as styles from "./Styles";
import "./Home.css";
import { useEffect, useState } from "react";
import { CometChatTheme } from "@cometchat-pro/react-ui-kit";
import { CometChat } from "@cometchat-pro/chat";
import { Link, useHistory } from "react-router-dom";

import { MenuCard } from "../MenuCard/MenuCard";
import { ComponentCard } from "../ComponentCard/ComponentCard";
import { Modal } from "../Modal/Modal";

import navigateconURL from "../assets/right-arrow-2.png";
import logoutIconURL from "../assets/power-off.png";
import themeIconURL from "../assets/switch-mode.png";
import rightconURL from "../assets/right-arrow.png";
import { MessageReceipt } from "../CometChatComponents/Shared/Secondary/MessageReceipt/MessageReceipt";
import { Avatar } from "../CometChatComponents/Shared/Secondary/Avatar/Avatar";

/**
 * CometChat Components
 */

export const Home = (props) => {
    const { menu, data, isMobileView } = props;

    const [renderComponent, setRenderComponent] = useState(null);
    const [theme, setTheme] = useState(new CometChatTheme({}));
    const [toggleView, setToggleView] = useState(false);

    let history = useHistory();

    useEffect(() => {
        document.addEventListener("keydown", handleKeyPress, false);

        return () => {
            document.removeEventListener("keydown", handleKeyPress, false);
        };
    }, []);
    
    useEffect(() => {
        setToggleView(!isMobileView)
    }, [isMobileView])

    const handleKeyPress = (e) => {
        if (e.key === "Escape") {
            setRenderComponent(null);
        }
    };

    const changeTheme = () => {
        if (theme?.palette?.mode == "dark") {
            setTheme(
                new CometChatTheme({
                    palette: {
                        mode: "light",
                    },
                })
            );
        } else {
            setTheme(
                new CometChatTheme({
                    palette: {
                        mode: "dark",
                    },
                })
            );
        }
    };

    const logout = () => {
        CometChat.logout().then(
            (user) => {
                console.log("Logout successfull:");
                props.setLoggedInUser(null);
                history.replace("/login");
            },
            (error) => {
                console.log("Logout failed", { error });
            }
        );
    };

    return (
        <>
            <div className='home__screen'>
                <div
                    className='home__screen__sidebar'
                    style={styles.sidebarStyle(theme)}
                >
                    <div className='sidebar__header'>
                        <span
                            className='header__title'
                            style={styles.headerTitleStyle(theme)}
                        >
                            UI Components
                        </span>
                    </div>

                    <div className='sidebar__content'>
                        {Object.keys(menu)?.map((menuItem, menuItemKey) => {
                            return (
                                <Link to={`/${menuItem}`} key={menuItemKey}>
                                    <MenuCard
                                        title={menu[menuItem]?.title}
                                        content={menu[menuItem]?.description}
                                        icon={rightconURL}
                                        theme={theme}
                                        onClick={() => setToggleView(true)
                                        }
                                    />
                                </Link>
                            );
                        })}
                    </div>

                    <div className='sidebar__footer'>
                        <footer style={styles.footerStyle(theme)}>v1.0-beta1</footer>
                    </div>
                </div>

                {toggleView ?
                    <div
                        className='home__screen__main'
                        style={styles.mainscreenStyle(theme)}
                    >
                        <div className='navbar'>
                            <div className='navbar__left'>
                                <span
                                    className='root__page'
                                    style={styles.rootPageStyle(theme)}
                                    onClick={() => setToggleView(!toggleView)}
                                >
                                    UI Components
                                </span>
                                <span className='pointer' style={styles.pointerStyle(theme)}>
                                    <span
                                        style={styles.navigateIconURL(theme, navigateconURL)}
                                    ></span>
                                </span>
                                <span
                                    className='active__page'
                                    style={styles.currentPageStyle(theme)}
                                >
                                    {data?.title}
                                </span>
                            </div>

                            <div className='navbar__right'>
                                <div
                                    className='theme__mode'
                                    style={styles.themeModeIoncStyle(theme, themeIconURL)}
                                    onClick={() => changeTheme()}
                                ></div>
                                <div
                                    className='logout__icon'
                                    style={styles.logoutIoncStyle(theme, logoutIconURL)}
                                    onClick={() => logout()}
                                ></div>
                            </div>
                        </div>

                        <h2 className='contentHeading'>{data?.title}</h2>

                        {data?.sections?.map((section, sectionKey) => {
                            return (
                                <div key={sectionKey} className='sectionWrapper'>
                                    <h3
                                        className='sectionHeading'
                                        style={styles.sectionHeadingStyle(theme)}
                                    >
                                        {section?.sectionTitle}
                                    </h3>
                                    <div className='content'>
                                        {section?.sectionList?.map(
                                            (sectionListItem, sectionListItemKey) => {
                                                return (
                                                    <ComponentCard
                                                        key={sectionListItemKey}
                                                        title={sectionListItem?.title}
                                                        content={sectionListItem?.content}
                                                        onClick={() =>
                                                            setRenderComponent(
                                                                sectionListItem?.renderComponent
                                                            )
                                                        }
                                                        redirectURL={sectionListItem?.redirectURL}
                                                        icon={sectionListItem?.icon}
                                                        theme={theme}
                                                    />
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {renderComponent && renderComponent?.component ? (
                            <Modal
                                title={renderComponent?.title}
                                width={renderComponent?.width}
                                theme={theme}
                                renderDetails={() => {
                                    return <renderComponent.component theme={theme} />;
                                }}
                                onClose={() => setRenderComponent(null)}
                            />
                        ) : null}
                    </div>
                    : null}
            </div>
        </>
    );
};
