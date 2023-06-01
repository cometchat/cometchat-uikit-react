import { cardStyle, chatHeaderTextStyle, contentContainerStyle, contentStyle, footerStyle, headerStyle, headerTitle, imageStyle, loginSignupStyle, mainContainerStyle, titleStyle, versionStyle } from "./style";
import Image from "../../assets/Image-518@1x.png";
import { useContext } from "react";
import { CometChatContext } from "@cometchat-pro/react-ui-kit";
import { IsMobileViewContext } from "../../IsMobileViewContext";

interface ILoginSignupProps {
    title : string,
    children : JSX.Element
};

export function LoginSignup(props : ILoginSignupProps) {
    const {
        title,
        children
    } = props;

    const { theme } = useContext(CometChatContext);
    const isMobileView = useContext(IsMobileViewContext);

    function getHeader() {
        return (
            <div
                style = {headerStyle(theme)}
            >
                <div
                    style = {headerTitle(theme)}
                >
                    <span>comet</span>
                    <span
                        style = {chatHeaderTextStyle()}
                    >
                        chat
                    </span>
                </div>
                <div
                    style = {versionStyle(theme)}
                >
                    3.0.12-pluto.beta.2
                </div>
            </div>
        );
    }

    function getContent() {
        return (
            <div
                style = {contentContainerStyle()}
            >
                <div
                    style = {contentStyle(isMobileView)}
                >
                    <div
                        style = {titleStyle(theme)}
                    >
                        {title}
                    </div>
                    <div
                        style = {cardStyle()}
                    >
                        {children}
                    </div>
                </div>
                <img
                    src = {Image}
                    alt = "Login signup"
                    style = {imageStyle(!isMobileView)}
                />
            </div>
        );
    }

    function getFooter() {
        return (
            <div
                style = {footerStyle(theme)}
            >
                2023 ⓒ CometChat
            </div>
        );
    }

    return (
        <div
            style = {loginSignupStyle()}
        >
            <div
                style = {mainContainerStyle()}
            >
                {getHeader()}
                {getContent()}
                {getFooter()}
            </div>
        </div>
    );
}
