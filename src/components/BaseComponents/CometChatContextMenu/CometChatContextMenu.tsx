import React, { CSSProperties, JSX, useCallback, useEffect, useRef, useState } from 'react';
import { CometChatPopover } from "../CometChatPopover/CometChatPopover";
import { CometChatActionsIcon, CometChatActionsView, CometChatOption } from '../../../modals';
import { Placement } from '../../../Enums/Enums';
import { fireClickEvent } from '../../../utils/util';
import { isMobileDevice } from '../../../utils/util';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
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
    /* Specifies whether the menu should use parent height for positioning */
    useParentHeight?: boolean;
    /* If true, forces the menu to open only at the specified placement without any positioning logic */
    forceStaticPlacement?: boolean;
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
        useParentContainer = false,
        useParentHeight = false,
        forceStaticPlacement = false
    } = props;
    const popoverRef = React.createRef<{
        openPopover: () => void;
        closePopover: () => void;
    }>();
    const moreButtonRef = useRef<HTMLDivElement>(null);
    const subMenuRef = useRef<HTMLDivElement>(null);
    const [positionStyleState, setPositionStyleState] = useState<CSSProperties>({});
    const parentViewRef = useRef<HTMLDivElement | null>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const IframeContext = useCometChatFrameContext();
    
    const getCurrentWindow = ()=>{
      return IframeContext?.iframeWindow || window;
    }

    const getCurrentDocument = ()=>{
      return IframeContext?.iframeDocument || document;
    }


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
          
            getCurrentDocument().addEventListener('click', handleClickOutside);
            return () => getCurrentDocument().removeEventListener('click', handleClickOutside);
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
    }, [setPositionStyleState]);

    /* This function returns More button component. */
    const getMoreButton = useCallback(() => {
        return (
            <div
                title={moreIconHoverText}
                onClick={handleMenuClick}
                className="cometchat-menu-list__sub-menu"
                ref={moreButtonRef}
                onMouseEnter={()=>{
                    getPopoverPositionStyle();
                }}
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
                // Don't apply outer menu wrapper class for:
                // - First item in main menu
                // - Menus with fewer than 3 items
                const className =
                (index == 0 || menu.length <= 2) && !isSubMenu
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
                                        <div className={isSubMenu ? `cometchat-menu-list__sub-menu-list-item-icon cometchat-menu-list__sub-menu-list-item-icon-${menuData.id}` : `cometchat-menu-list__main-menu-item-icon cometchat-menu-list__main-menu-item-icon-${menuData.id}`} style={menuData?.iconURL ? { WebkitMask: `url(${menuData?.iconURL}) center center no-repeat`,display:"flex" } : undefined} />
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
                                    if(onOptionClicked){
                                        onOptionClicked?.(menuData)
                                    }
                                    else if (menuData instanceof CometChatOption || menuData instanceof CometChatActionsIcon) {
                                        if (menuData?.onClick) {
                                            menuData.onClick()
                                        }
                                    }
                                }}
                            >
                                <div className={isSubMenu ? `cometchat-menu-list__sub-menu-list-item-icon cometchat-menu-list__sub-menu-list-item-icon-${menuData.id}` : `cometchat-menu-list__main-menu-item-icon cometchat-menu-list__main-menu-item-icon-${menuData.id}`} style={menuData?.iconURL ? { WebkitMask: `url(${menuData?.iconURL}) center center no-repeat` ,WebkitMaskSize:"contain",display:"flex"} : undefined} />
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
    }, [placement, data, onOptionClicked, getMoreButton, disableBackgroundInteraction])
        
    const getTopMostCometChatElement = (): HTMLElement | undefined => {
        if(!moreButtonRef.current) return;
        let current = moreButtonRef.current;
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
    /**
     * Calculates the position style for the context menu based on different positioning strategies
     * 
     * @param rect - The bounding rectangle of the reference element (more button)
     * @param menuDimensions - The dimensions of the menu (width and height)
     * @param parentRect - The bounding rectangle of the parent container (if applicable)
     * @param availablePlacement - The preferred placement of the menu
     * @param positioningStrategy - The strategy to use for positioning ('viewport', 'parent' or 'centered')
     * @returns CSSProperties object with the calculated positioning
     */
    const calculateMenuPosition = useCallback((
        rect: DOMRect,
        menuDimensions: { width: number; height: number },
        parentRect?: DOMRect | null,
        availablePlacement: Placement = placement,
        positioningStrategy: 'viewport' | 'parent' | 'centered' = 'viewport'
    ): CSSProperties => {
        const { width, height } = menuDimensions;
        let positionStyle: CSSProperties = {};
        const padding = 10; // Common padding value used throughout

        // If forceStaticPlacement is true, use simple static positioning based on placement
        if (forceStaticPlacement) {
            // Get parent container boundaries if available
            const viewportWidth = window.innerWidth;
            const containerLeft = parentRect ? parentRect.left : 0;
            const containerRight = parentRect ? parentRect.right : viewportWidth;
            
            let calculatedLeft = rect.left;
            let calculatedTop = rect.top;
            
            switch (availablePlacement) {
                case Placement.top:
                    calculatedTop = rect.top - height - padding;
                    calculatedLeft = rect.left;
                    break;
                case Placement.bottom:
                    calculatedTop = rect.bottom + padding;
                    calculatedLeft = rect.left;
                    break;
                case Placement.left:
                    calculatedTop = rect.top;
                    calculatedLeft = rect.left - width - padding;
                    break;
                case Placement.right:
                    calculatedTop = rect.top;
                    calculatedLeft = rect.right + padding;
                    break;
                default:
                    calculatedTop = rect.top;
                    calculatedLeft = rect.left - width - padding;
                    break;
            }
            
            // Adjust horizontal position to stay within parent boundaries
            if (calculatedLeft + width > containerRight) {
                // Menu would exceed right boundary, move it left
                calculatedLeft = containerRight - width - padding;
            }
            if (calculatedLeft < containerLeft) {
                // Menu would exceed left boundary, move it right
                calculatedLeft = containerLeft + padding;
            }
            
            positionStyle.top = `${calculatedTop}px`;
            positionStyle.left = `${calculatedLeft}px`;
            return positionStyle;
        }

        // When using parent container as viewport
        if (positioningStrategy === 'parent' && parentRect) {
            if ([Placement.top, Placement.bottom].includes(availablePlacement)) {
                // Vertical positioning based on placement
                if (useParentHeight) {
                    positionStyle.top = availablePlacement === Placement.bottom
                        ? `${Math.min(parentRect.bottom - height, rect.bottom + padding)}px`
                        : `${Math.max(parentRect.top, rect.top - height - padding)}px`;
                } else {
                    positionStyle.top = availablePlacement === Placement.bottom
                        ? `${rect.bottom + padding}px`
                        : `${rect.top - height - padding}px`;
                }

                // Horizontal positioning - constrain to parent width
                let adjustedLeft = Math.max(parentRect.left, rect.left);
                adjustedLeft = Math.min(adjustedLeft, parentRect.right - width - padding);
                positionStyle.left = `${adjustedLeft}px`;
            } else {
                // Horizontal positioning based on placement
                positionStyle.left = availablePlacement === Placement.left
                    ? `${Math.max(parentRect.left, rect.left - width - padding)}px`
                    : `${Math.min(parentRect.right - width, rect.right + padding)}px`;

                // Vertical positioning - constrain to parent height if needed
                if (useParentHeight) {
                    let adjustedTop = Math.max(parentRect.top, rect.top);
                    adjustedTop = Math.min(adjustedTop, parentRect.bottom - height - padding);
                    positionStyle.top = `${adjustedTop}px`;
                } else {
                    positionStyle.top = `${rect.top}px`;
                }
            }
        }
        // When positioning the menu centered relative to the trigger
        else if (positioningStrategy === 'centered' && parentRect) {
            if (availablePlacement === Placement.top) {
                positionStyle.top = `${rect.top - height - padding}px`;
            } else if (availablePlacement === Placement.bottom) {
                positionStyle.top = `${rect.bottom + padding}px`;
            }
            
            // Center the menu horizontally
            const menuLeft = rect.left + rect.width / 2 - width / 2;
            if (menuLeft < parentRect.left) {
                positionStyle.left = `${parentRect.left + padding}px`;
            } else if (menuLeft + width > parentRect.right) {
                positionStyle.left = `${parentRect.right - width - padding}px`;
            } else {
                positionStyle.left = `${menuLeft}px`;
            }
        }
        // Default: position relative to viewport
        else {
            const viewportHeight = getCurrentWindow().innerHeight;
            const viewportWidth = getCurrentWindow().innerWidth;

            if ([Placement.top, Placement.bottom].includes(availablePlacement)) {
                // Check if there's enough space below or above
                positionStyle.top = availablePlacement === Placement.bottom
                    ? `${rect.bottom + height + padding > viewportHeight ? rect.top - height - padding : rect.bottom + padding}px`
                    : `${rect.top - height - padding < 0 ? rect.bottom + padding : rect.top - height - padding}px`;

                // Check if there's enough space to the right
                positionStyle.left = rect.left + width - padding > viewportWidth
                    ? `${viewportWidth - width - padding}px`
                    : `${rect.left - padding}px`;
            } else {
                // Check if there's enough space to the left or right
                positionStyle.left = availablePlacement === Placement.left
                    ? `${rect.left - width - padding < 0 ? rect.right + padding : rect.left - width - padding}px`
                    : `${rect.right + width + padding > viewportWidth ? rect.left - width - padding : rect.right + padding}px`;

                // Check if there's enough space below
                positionStyle.top = rect.top + height - padding > viewportHeight
                    ? `${viewportHeight - height - padding}px`
                    : `${rect.top - padding}px`;
            }
        }

        return positionStyle;
    }, [placement, useParentHeight, forceStaticPlacement]);

    const getAvailablePlacement = useCallback((rect:DOMRect, height:number) => {
        // If forceStaticPlacement is true, always return the placement prop without any logic
        if (forceStaticPlacement) {
            return placement;
        }

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
    }, [placement, forceStaticPlacement]);
    
    const calculatePopoverPosition = useCallback(() => {
        if (!moreButtonRef.current || !parentViewRef.current) return;
        const height = subMenuRef.current?.clientHeight || (48 * data.length);
        const width = subMenuRef.current?.clientWidth || 160;
        const rect = moreButtonRef.current?.getBoundingClientRect();
        const parentViewRect = parentViewRef.current.getBoundingClientRect();
        if (!rect || !parentViewRect) return;
    
        const availablePlacement = getAvailablePlacement(rect, height);
        const positionStyle = calculateMenuPosition(
            rect, 
            { width, height }, 
            parentViewRect,
            availablePlacement, 
            'parent'
        );
        
        setPositionStyleState(positionStyle);
    }, [showSubMenu, useParentHeight, calculateMenuPosition, getAvailablePlacement]);
    
    const setMenuHeight = useCallback(() => {
        if (!subMenuRef.current || !moreButtonRef.current) return;

        const menuWidth = subMenuRef.current.scrollWidth;
        const menuHeight = subMenuRef.current.scrollHeight;
        const rect = moreButtonRef.current.getBoundingClientRect();
        const parentRect = parentViewRef.current?.getBoundingClientRect() || {
            left: 0,
            right: getCurrentWindow().innerWidth,
            width: getCurrentWindow().innerWidth,
            // Add missing DOMRect properties
            height: getCurrentWindow().innerHeight,
            top: 0,
            bottom: getCurrentWindow().innerHeight,
            x: 0,
            y: 0,
            toJSON: () => ({})
        };

        const positionStyle = calculateMenuPosition(
            rect, 
            { width: menuWidth, height: menuHeight }, 
            parentRect as DOMRect,
            placement,
            'centered'
        );

        setPositionStyleState(positionStyle);
    }, [placement, calculateMenuPosition]);
    
    const getPopoverPositionStyle = useCallback(() => {
        if (useParentContainer) {
            parentViewRef.current = parentViewRef.current || getTopMostCometChatElement() as HTMLDivElement | null;
            calculatePopoverPosition();
            return;
        }
        
        if (!useParentContainer && useParentHeight) {
            setMenuHeight();
            return;
        }
    
        const height = subMenuRef.current?.clientHeight || (48 * data.length);
        const width = subMenuRef.current?.clientWidth || 160;
        const rect = moreButtonRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const availablePlacement = getAvailablePlacement(rect, height);
        const positionStyle = calculateMenuPosition(
            rect, 
            { width, height }, 
            null,
            availablePlacement, 
            'viewport'
        );
        
        if (Object.keys(positionStyleState).length === 0) {
            setPositionStyleState(positionStyle);
        }
    }, [showSubMenu, positionStyleState, calculatePopoverPosition, useParentContainer, useParentHeight, setMenuHeight, calculateMenuPosition, getAvailablePlacement]);
        
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
    
    useEffect(() => {
        if(useParentContainer){
            parentViewRef.current = getTopMostCometChatElement() as HTMLDivElement;
        }
    }, [useParentContainer,showSubMenu]);

    useEffect(() => {
        if (useParentContainer && !useParentHeight) {
            // Handle window resize events to update menu position
            const handleResize = () => {
                // Debounce resize events to avoid excessive updates
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current);
                }

                resizeTimeoutRef.current = setTimeout(() => {
                    if (showSubMenu) {
                        getPopoverPositionStyle();
                    }
                }, 100); // 100ms debounce
            };

            getCurrentWindow().addEventListener('resize', handleResize);
            return () => {
                getCurrentWindow().removeEventListener('resize', handleResize);
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current);
                }
            };
        }     
    }, [showSubMenu, getPopoverPositionStyle,useParentContainer, useParentHeight]);

    return (
        <div className="cometchat">
            <div className="cometchat-menu-list">
                <div className="cometchat-menu-list__main-menu">
                    {getTopMenu()}
                </div>
                   {disableBackgroundInteraction  && showSubMenu &&  getFullScreenOverlay()}
                    <div
                        ref={subMenuRef}
                        className="cometchat-menu-list__sub-menu-list"
                        id="subMenuContext"
                        style={{
                            ...positionStyleState,
                        visibility: showSubMenu ? "visible" : "hidden",
                        opacity: showSubMenu ? 1 : 0,
                        pointerEvents: showSubMenu ? 'auto' : 'none',
                        transition: 'visibility 0s, opacity 0.3s ease',
                            ...(disableBackgroundInteraction  && showSubMenu &&  {
                                zIndex: 1000,
                              }),
                              
                          }}
                    >
                    {getSubMenu()}
                </div>
            </div>
        </div>
    )
}

export { CometChatContextMenu };