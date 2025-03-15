import React, { CSSProperties, JSX, useCallback, useEffect, useRef, useState } from 'react';
import { CometChatPopover } from "../CometChatPopover/CometChatPopover";
import { CometChatActionsIcon, CometChatActionsView, CometChatOption } from '../../../modals';
import { Placement } from '../../../Enums/Enums';
import { fireClickEvent } from '../../../utils/util';
import { isMobileDevice } from '../../../utils/util';

interface ContextMenuProps {
    /* data to be used for the menu items. */
    data: Array<CometChatActionsIcon | CometChatActionsView | CometChatOption>,
    /* to specify how many menu items should be visible by default. */
    topMenuSize?: number,
    /* tooltip to be shown for the more menu button. */
    moreIconHoverText?: string,
    /* callback function which is triggered on click of menu item. */
    onOptionClicked?: (option: CometChatActionsIcon | CometChatActionsView | CometChatOption) => void,
    /* to specify the position of the menu. */
    placement?: Placement,
    /* Specifies whether the menu should close when clicking outside.*/
    closeOnOutsideClick?: boolean;
    /* Specifies whether the background interaction should be allowed */
    disableBackgroundInteraction?:boolean;
    /* Specifies whether the menu should use parent as a viewport*/
    useParentContainer?: boolean;
}

/**
 * CometChatContextMenu is a composite component used to display menu data in required format. 
 * It accepts a data array for displaying the menu items and topMenuSize to specify how many menu items should be visible by default. 
 * It also accepts a URL for the 'more' icon, placement and a menu click callback function for customization purposes.
 */
const CometChatContextMenu = (props: ContextMenuProps) => {
    const [showSubMenu, setShowSubMenu] = React.useState<boolean>(false);
    const {
        data,
        topMenuSize = 2,
        moreIconHoverText,
        onOptionClicked,
        placement = Placement.left,
        closeOnOutsideClick = false,
        disableBackgroundInteraction = false,
        useParentContainer = false
    } = props;
    const popoverRef = React.createRef<{
        openPopover: () => void;
        closePopover: () => void;
    }>();
    const moreButtonRef = useRef<HTMLDivElement>(null);
    const subMenuRef = useRef<HTMLDivElement>(null);
    const [positionStyleState, setPositionStyleState] = useState<CSSProperties>({});
    const parentViewRef = useRef<HTMLDivElement | null>(null);


    /**
    * useEffect to handle outside clicks for a submenu.
    *
    * - Adds an event listener to detect clicks outside the `moreButtonRef` element.
    * - Closes the submenu when a click is detected outside the element.
    *
    * @function
    * @param {void} None - This effect runs once when the component mounts.
    * @returns {void} Cleanup function to remove the click event listener when the component unmounts.
    */
    const handleClickOutside = (event: MouseEvent) => {
        if (moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)) {
            setShowSubMenu(false);
        }
    };
    useEffect(() => {
        if (closeOnOutsideClick) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [closeOnOutsideClick]);


    /* This function is used to show and hide the sub-menu. */
    const handleMenuClick = useCallback(() => {
        setShowSubMenu((showSubMenu: boolean) => {
            if(!showSubMenu){
                popoverRef.current?.closePopover();
            }
           return !showSubMenu
        })
        setTimeout(() => {
            getPopoverPositionStyle()
        }, 0);
    }, [setPositionStyleState]);



    /* This function returns More button component. */
    const getMoreButton = useCallback(() => {
        return (
            <div
                title={moreIconHoverText}
                onClick={handleMenuClick}
                className="cometchat-menu-list__sub-menu"
                ref={moreButtonRef}
                style={{
                    ...(disableBackgroundInteraction && showSubMenu && {
                        zIndex: 1000,
                        pointerEvents: 'auto',
                      }),
                  }}
            >
                <div
                    className="cometchat-menu-list__sub-menu-icon"

                />
            </div>
        )
    }, [moreIconHoverText, handleMenuClick,showSubMenu,disableBackgroundInteraction])

    /* This function uses menu data and generates menu components conditionally. */
    const getMenu = useCallback((menu: Array<CometChatActionsIcon | CometChatActionsView | CometChatOption>, isSubMenu: boolean) => {
        if (menu.length > 0) {
            return menu?.map((menuData, index: number) => {
                const className =
                index == 0 && !isSubMenu
                    ? ""
                    : "cometchat-menu-list__menu";
                let menuButton, moreButton = null;
                if (menuData instanceof CometChatActionsView && menuData?.customView) {
                    menuButton = (
                        <div id={menuData.id} >
                            <CometChatPopover
                                disableBackgroundInteraction={disableBackgroundInteraction}
                                useParentContainer={true}
                                ref={popoverRef}
                                closeOnOutsideClick={closeOnOutsideClick}
                                placement={placement}
                                content={<>{menuData?.customView(()=>{
                                    popoverRef.current?.closePopover()
                                })}</>}
                            >
                                <div slot="children">
                                    <div
                                        onClick={() => {
                                            setPositionStyleState({});
                                            setShowSubMenu(false);
                                        }}
                                        title={menuData?.title}
                                        className={isSubMenu ? `cometchat-menu-list__sub-menu-list-item` : `cometchat-menu-list__main-menu-item`}
                                    >
                                        <div className={isSubMenu ? `cometchat-menu-list__sub-menu-list-item-icon cometchat-menu-list__sub-menu-list-item-icon-${menuData.id}` : `cometchat-menu-list__main-menu-item-icon cometchat-menu-list__main-menu-item-icon-${menuData.id}`} style={menuData?.iconURL ? { WebkitMask: `url(${menuData?.iconURL}), center, center, no-repeat`,display:"flex" } : undefined} />
                                        {isSubMenu ? <label className={`cometchat-menu-list__sub-menu-item-title cometchat-menu-list__sub-menu-item-title-${menuData.id}`}>{menuData?.title}</label> : ""}
                                    </div>
                                </div>
                            </CometChatPopover>
                        </div>);
                } else {
                    menuButton = (
                        <div id={menuData.id} className={className}>
                            <div
                                className={isSubMenu ? `cometchat-menu-list__sub-menu-list-item` : `cometchat-menu-list__main-menu-item`}
                                title={menuData?.title}
                                onClick={() => {
                                    setShowSubMenu(false);
                                    setPositionStyleState({});
                                    onOptionClicked?.(menuData)
                                }}
                            >
                                <div className={isSubMenu ? `cometchat-menu-list__sub-menu-list-item-icon cometchat-menu-list__sub-menu-list-item-icon-${menuData.id}` : `cometchat-menu-list__main-menu-item-icon cometchat-menu-list__main-menu-item-icon-${menuData.id}`} style={menuData?.iconURL ? { WebkitMask: `url(${menuData?.iconURL}), center, center, no-repeat` ,WebkitMaskSize:"contain",display:"flex"} : undefined} />
                                {isSubMenu ? <label className={`cometchat-menu-list__sub-menu-item-title cometchat-menu-list__sub-menu-item-title-${menuData.id}`}>{menuData?.title}</label> : ""}
                            </div>
                        </div>
                    );
                };

                if (!isSubMenu && data?.length > menu?.length && index === menu?.length - 1) {
                    moreButton = getMoreButton();
                }

                return (
                    <div key={menuData.title} className="cometchat-menu-list__menu-wrapper">
                        {menuButton}
                        {moreButton}
                    </div>
                )
            })
        } else {
            const moreButton = getMoreButton();
            return (
                <div className="cometchat-menu-list__menu-wrapper">
                    {moreButton}
                </div>
            )
        }
    }, [placement, data, onOptionClicked, getMoreButton,disableBackgroundInteraction])

    const getTopMostCometChatElement = (): HTMLElement | undefined => {
        if(!subMenuRef.current) return;
        let current = subMenuRef.current;
        let topMostElement: HTMLElement | null = null;
        while (current) {
            if (current.classList?.contains('cometchat')) {
                topMostElement = current;
            }
            current = current.parentElement as HTMLDivElement;
        }
        return topMostElement as HTMLDivElement;
    };

    /* this function is used to trigger the getMenu function with main menu data. */
    const getTopMenu = useCallback(() => {
        return getMenu(data.slice(0, topMenuSize > 0 ? topMenuSize - 1 : 0), false);
    }, [getMenu, topMenuSize, data])

    /* this function is used to trigger the getMenu function with sub menu data. */
    const getSubMenu = useCallback(() => {
        return getMenu(data.slice(topMenuSize > 0 ? topMenuSize - 1 : 0), true);
    }, [getMenu, topMenuSize, data])
    const getAvailablePlacement = useCallback((rect:DOMRect, height:number) => {
        const spaceAbove = rect.top;
        const parentViewRect = parentViewRef.current?.getBoundingClientRect();
        const spaceBelow = parentViewRect ? parentViewRect.bottom - rect.bottom : 0;
    
        if (!useParentContainer) {
            if (isMobileDevice()) {
                return spaceBelow >= height + 10 ? Placement.bottom : Placement.top;
            }
            return placement;
        }
    
        if (!parentViewRect) return placement;
        return spaceBelow >= height + 10 ? Placement.bottom : spaceAbove >= height + 10 ? Placement.top : placement;
    }, [placement]);
    
    const calculatePopoverPosition = useCallback(() => {
        if (!moreButtonRef.current || !parentViewRef.current) return;
        
        const height = document.getElementById("subMenuContext")?.clientHeight || (48 * data.length);
        const width = document.getElementById("subMenuContext")?.clientWidth || 160;
        const rect = moreButtonRef.current?.getBoundingClientRect();
        const parentViewRect = parentViewRef.current.getBoundingClientRect();
        if (!rect || !parentViewRect) return;
    
        const availablePlacement = getAvailablePlacement(rect, height);
        let positionStyle:CSSProperties = {};
    
        if ([Placement.top, Placement.bottom].includes(availablePlacement)) {
            positionStyle.top = availablePlacement === Placement.bottom
                ? `${Math.min(parentViewRect.bottom - height, rect.bottom + 10)}px`
                : `${Math.max(parentViewRect.top, rect.top - height - 10)}px`;
    
            let adjustedLeft = Math.max(parentViewRect.left, rect.left);
            adjustedLeft = Math.min(adjustedLeft, parentViewRect.right - width - 10);
            positionStyle.left = `${adjustedLeft}px`;
        } else {
            positionStyle.left = availablePlacement === Placement.left
                ? `${Math.max(parentViewRect.left, rect.left - width - 10)}px`
                : `${Math.min(parentViewRect.right - width, rect.right + 10)}px`;
            
            let adjustedTop = Math.max(parentViewRect.top, rect.top);
            adjustedTop = Math.min(adjustedTop, parentViewRect.bottom - height - 10);
            positionStyle.top = `${adjustedTop}px`;
        }
        
        setPositionStyleState(positionStyle);
    }, [showSubMenu]);
    
    const getPopoverPositionStyle = useCallback(() => {
        if (useParentContainer) {
            parentViewRef.current = parentViewRef.current || getTopMostCometChatElement() as HTMLDivElement | null;
            calculatePopoverPosition();
            return;
        }
    
        const height = document.getElementById("subMenuContext")?.clientHeight || (48 * data.length);
        const width = document.getElementById("subMenuContext")?.clientWidth || 160;
        const rect = moreButtonRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const availablePlacement = getAvailablePlacement(rect, height);
        let positionStyle:CSSProperties = {};
    
        if ([Placement.top, Placement.bottom].includes(availablePlacement)) {
            positionStyle.top = availablePlacement === Placement.bottom
                ? `${rect.bottom + height + 10 > viewportHeight ? rect.top - height - 10 : rect.bottom + 10}px`
                : `${rect.top - height - 10 < 0 ? rect.bottom + 10 : rect.top - height - 10}px`;
    
            positionStyle.left = rect.left + width - 10 > viewportWidth
                ? `${viewportWidth - width - 10}px`
                : `${rect.left - 10}px`;
        } else {
            positionStyle.left = availablePlacement === Placement.left
                ? `${rect.left - width - 10 < 0 ? rect.right + 10 : rect.left - width - 10}px`
                : `${rect.right + width + 10 > viewportWidth ? rect.left - width - 10 : rect.right + 10}px`;
    
            positionStyle.top = rect.top + height - 10 > viewportHeight
                ? `${viewportHeight - height - 10}px`
                : `${rect.top - 10}px`;
        }
        
        if (Object.keys(positionStyleState).length === 0) {
            setPositionStyleState(positionStyle);
        }
    }, [showSubMenu, positionStyleState, calculatePopoverPosition, useParentContainer]);
        
    useEffect(() => {
        if(useParentContainer){
            parentViewRef.current = getTopMostCometChatElement() as HTMLDivElement;
        }
    }, [useParentContainer,showSubMenu]);
        
    function getFullScreenOverlay() {
        return <div
            className="cometchat-popover__overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 999,
                backgroundColor: 'transparent',
                pointerEvents: 'auto',
            }}
            onClick={(e) => {
                e?.stopPropagation();
                handleClickOutside(e.nativeEvent);
                fireClickEvent()
            }}
            onWheel={(e) => e?.stopPropagation()}
            onMouseMove={(e) => e?.stopPropagation()}
            onKeyDown={(e) => e?.stopPropagation()}
        />
    }

    return (
        <div className="cometchat">
            <div className="cometchat-menu-list">
                <div className="cometchat-menu-list__main-menu">
                    {getTopMenu()}
                </div>
                {showSubMenu &&
                   <>
                   {disableBackgroundInteraction  &&  getFullScreenOverlay()}
                    <div
                        ref={subMenuRef}
                        className="cometchat-menu-list__sub-menu-list"
                        id="subMenuContext"
                        style={{
                            ...positionStyleState,
                            ...(disableBackgroundInteraction  && {
                                zIndex: 1000,
                                pointerEvents: 'auto',
                              }),
                          }}
                    >
                    {getSubMenu()}
                </div>
                   </>}
            </div>
        </div>
    )
}

export { CometChatContextMenu };