import { MenuListStyle } from 'my-cstom-package-lit';
import { CometChatActionsIcon, CometChatActionsView } from "uikit-resources-lerna";
import React, { useCallback, useContext, JSX } from 'react';
import { topMenuStyle, subMenuStyle, menuItemStyle, contextMenuStyle, menuButtonStyle, moreButtonStyle, popoverStyle } from "./style";
import { Placement } from 'uikit-utils-lerna';
import { CometChatContext } from "../../../CometChatContext";
import { CometChatButton } from '../CometChatButton';

interface ContextMenuProps {
    data: CometChatActionsIcon[] | CometChatActionsView[],
    topMenuSize: number,
    moreIconURL: string,
    moreIconHoverText: string,
    ContextMenuStyle: MenuListStyle,
    onOptionClicked: (option : CometChatActionsIcon | CometChatActionsView) => void,
    placement: Placement
}

export const CometChatContextMenu = (props: ContextMenuProps) => {
    const { theme } = useContext(CometChatContext)
    const [showSubMenu, setShowSubMenu] = React.useState<boolean>(false);
    const moreButtonRef = React.useRef<JSX.IntrinsicElements["cometchat-button"] | null>(null);
    const {
        data,
        topMenuSize,
        moreIconURL,
        moreIconHoverText,
        ContextMenuStyle,
        onOptionClicked,
        placement
    } = props;

    const handleMenuClick = useCallback(() => setShowSubMenu((showSubMenu: boolean) => !showSubMenu), []);

    const getMoreButton = useCallback(() => {
        return (
            <li style={menuItemStyle()} className="cc-context-menu__menu-item cc-context-menu__menu-item--more">
                <cometchat-button
                    ref={moreButtonRef}
                    buttonStyle={JSON.stringify(moreButtonStyle(ContextMenuStyle))}
                    hoverText={moreIconHoverText}
                    iconURL={moreIconURL}
                    onClick={handleMenuClick}
                />
            </li>
        )
    }, [ContextMenuStyle, moreIconHoverText, moreIconURL, handleMenuClick])

    const getMenu = useCallback((menu : CometChatActionsIcon[] | CometChatActionsView[], isSubMenu : boolean) => {
        return menu?.map((menuData, index: number) => {
            let menuButton, moreButton = null;
            if (menuData instanceof CometChatActionsView && menuData?.customView) {
                menuButton = (
                    <li style={menuItemStyle()} className="cc-context-menu__menu-item">
                        <cometchat-popover popoverStyle={JSON.stringify(popoverStyle)} placement={placement}>
                            <div slot="children">
                                <cometchat-button
                                    buttonStyle={JSON.stringify(menuButtonStyle(isSubMenu, menuData))}
                                    text={isSubMenu ? menuData?.title : ""}
                                    hoverText={menuData?.title}
                                    iconURL={menuData?.iconURL}
                                />
                            </div>
                            <div slot="content">
                                {menuData?.customView}
                            </div>
                        </cometchat-popover>
                    </li>);
            } else {
                menuButton = (
                    <li style={menuItemStyle()} className="cc-context-menu__menu-item">
                        <CometChatButton
                            buttonStyle={menuButtonStyle(isSubMenu, menuData)}
                            text={isSubMenu ? menuData?.title : ""}
                            hoverText={menuData?.title}
                            iconURL={menuData?.iconURL}
                            onClick={() => { onOptionClicked(menuData) }}
                        />
                    </li>
                );
            };

            if (!isSubMenu && data?.length > menu?.length && index === menu?.length - 1) {
                moreButton = getMoreButton();
            }

            return (
                <React.Fragment
                    key = {menuData.title}
                >
                    {menuButton}
                    {moreButton}
                </React.Fragment>
            )
        })
    }, [placement, data, onOptionClicked, getMoreButton])

    const getTopMenu = useCallback(() => {
        return getMenu(data.slice(0, topMenuSize - 1), false);
    }, [getMenu, topMenuSize, data])

    const getSubMenu = useCallback(() => {
        return getMenu(data.slice(topMenuSize - 1), true);
    }, [getMenu, topMenuSize, data])

    return (
        <div className="cc-context-menu" style={contextMenuStyle()}>
            <ul className="cc-context-menu__top-menu" style={topMenuStyle()}>{getTopMenu()}</ul>
            <ul className="cc-context-menu__sub-menu" style={subMenuStyle(showSubMenu, theme)}>{getSubMenu()}</ul>
        </div>
    )
}