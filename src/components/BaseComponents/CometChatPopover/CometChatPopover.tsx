import  { useState, useRef, useEffect, ReactNode, useCallback, forwardRef, useImperativeHandle, CSSProperties, useLayoutEffect } from 'react';
import { isMobileDevice } from '../../../utils/util';

export enum Placement {
    top = 'top',
    right = 'right',
    bottom = 'bottom',
    left = 'left',
}

interface PopoverProps {
    placement?: Placement;
    closeOnOutsideClick?: boolean;
    showOnHover?: boolean;
    debounceOnHover?: number;
    children: ReactNode;
    content: ReactNode;
    childClickHandler?: (openContent: Function, event: Event) => void;
    onOutsideClick?: () => void;
}

const CometChatPopover = forwardRef<{
    openPopover: () => void;
    closePopover: () => void;
}, PopoverProps>(
    (
        {
            placement = Placement.bottom,
            closeOnOutsideClick = true,
            showOnHover = false,
            debounceOnHover = 500,
            children,
            content,
            onOutsideClick,
            childClickHandler,
        },
        ref
    ) => {

        const onMouseHoverRef = useRef<any>(null);
        const [isOpen, setIsOpen] = useState(false);
        const [positionStyleState, setPositionStyleState] = useState<CSSProperties>({});
        const popoverRef = useRef<HTMLDivElement>(null);
        const childRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            openPopover() {
                getPopoverPositionStyle();
                setIsOpen(true);
            },
            closePopover() {
                
                setIsOpen(false);
            },
        }));
        
        useEffect(() => {
            if (!popoverRef.current) return;
            const observer = new MutationObserver(() => {
                requestAnimationFrame(() => getPopoverPositionStyle());
            });
            observer.observe(popoverRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
            });
            return () => observer.disconnect();
        }, [isOpen]);
        
   


        const togglePopover = useCallback((e?: any) => {
            setIsOpen(prev => !prev);
        }, []);
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current) {
                    const popoverRect = popoverRef.current.getBoundingClientRect();
                    const isInsideClick =
                        event.clientX >= popoverRect.left &&
                        event.clientX <= popoverRect.right &&
                        event.clientY >= popoverRect.top &&
                        event.clientY <= popoverRect.bottom;
                    if (!popoverRef.current.contains(event.target as Node) && !isInsideClick) {
                        setIsOpen(false);
                        if (onOutsideClick) {
                            onOutsideClick()
                        }
                    }
            }
        };
        useEffect(() => {
            if (closeOnOutsideClick && isOpen) {
           
                document.addEventListener('click', handleClickOutside);
                return () => document.removeEventListener('click', handleClickOutside);
            }
        }, [closeOnOutsideClick,isOpen]);
        

        useEffect(() => {
            const handleScroll = () => {
                if (!isOpen || !childRef.current) return;
        
                const rect = childRef.current.getBoundingClientRect();
        
                if (
                    rect.top < 0 ||
                    rect.left < 0 ||
                    rect.bottom > window.innerHeight ||
                    rect.right > window.innerWidth
                ) {
                    setIsOpen(false); 
                    if (onOutsideClick) {
                        onOutsideClick()
                    }
                }
            };

            window.addEventListener('resize', handleScroll);
            window.addEventListener('scroll', handleScroll, true);
            return () => {
                window.removeEventListener('resize', handleScroll);

                window.removeEventListener('scroll', handleScroll);
            };
        }, [isOpen]);
        
        

        /**
         * Updates the popover's position when opened and resets it when closed.
         * Uses useLayoutEffect to ensure the position is set before the browser repaints, 
         * preventing visual flickering.
         *
         * @param {boolean} isOpen - Whether the popover is open.
         * @param {string} content - The popover's content, affecting its size and position.
         * @param {Function} getPopoverPositionStyle - Calculates and sets the popover's position.
         * @param {Function} setPositionStyleState - Updates the popover's position style.
         */
        useLayoutEffect(() => {
            if (isOpen) {
    getPopoverPositionStyle()
            } else {
                setPositionStyleState({});
            }
        }, [content, isOpen]);

        const getAvailablePlacement = useCallback((rect: DOMRect,height: number)=>{
          const spaceAbove = rect.top;
             if (isMobileDevice()) {
                  if (spaceAbove >= height + 10) {
                      return Placement.bottom;
                  }
              return Placement.top;
              }
              return placement
          },[placement])
        
        const getPopoverPositionStyle = useCallback(() => {
            const height = popoverRef.current?.scrollHeight!;
            const width = popoverRef.current?.scrollWidth!;
            const rect = childRef.current?.getBoundingClientRect();
            if(!rect) return;
            const x_left = rect?.left!,
                x_right = rect?.right!,
                y_bot = rect?.bottom!,
                y_top = rect?.top!;

            const positionStyle = { top: "", right: "", bottom: "", left: "", };
            const viewportHeight = window.innerHeight, viewportWidth = window.innerWidth;
            const availablePlacement = getAvailablePlacement(rect,height);
            if (Object.keys(positionStyleState).length == 0) {
                if (availablePlacement === Placement.top || availablePlacement === Placement.bottom) {
                    if (availablePlacement === Placement.top) {
                        if (y_top - height - 10 < 0) {
                            positionStyle["top"] = `${y_bot + 10}px`;
                        } else {
                            positionStyle["bottom"] = `${viewportHeight - y_top}px`;
                        }
                    } else if (availablePlacement === Placement.bottom) {
                        if ((y_bot + height + 10) > viewportHeight) {
                            positionStyle["top"] = `${y_top - height - 10}px`;
                        } else {
                            positionStyle["top"] = `${y_bot + 10}px`;
                        }
                    }

                    if (((x_left + width) - 10) > viewportWidth) {
                        positionStyle["left"] = `${viewportWidth - width - 10}px`;
                    } else {
                        positionStyle["left"] = `${x_left - 10}px`;
                    }
                } else if (availablePlacement === Placement.left || availablePlacement === Placement.right) {
                    if (availablePlacement === Placement.left) {
                        if (x_left - width - 10 < 0) {
                            positionStyle["left"] = `${x_right + 10}px`;
                        } else {
                            positionStyle["left"] = `${x_left - width - 10}px`;
                        }
                    } else if (availablePlacement === Placement.right) {
                        if (x_right + width + 10 > viewportWidth) {
                            positionStyle["left"] = `${x_left - width - 10}px`;
                        } else {
                            positionStyle["left"] = `${x_right + 10}px`;
                        }
                    }

                    if (((y_top + height) - 10) > viewportHeight) {
                        positionStyle["top"] = `${viewportHeight - height - 10}px`;
                    } else {
                        positionStyle["top"] = `${y_top - 10}px`;
                    }
                }
                setPositionStyleState(positionStyle);
            }
        }, [isOpen, positionStyleState]);

        const onPopoverMouseEnter = () => {
            if (onMouseHoverRef.current) {
                clearTimeout(onMouseHoverRef.current);
                onMouseHoverRef.current = null;
            }
            if (showOnHover && !isOpen) {
                onMouseHoverRef.current = setTimeout(() => {
                    getPopoverPositionStyle()
                    setIsOpen(true)
                }, debounceOnHover);
                return onMouseHoverRef.current;
            }
        }

        const onPopoverMouseLeave = () => {
            if (onMouseHoverRef.current) {
                clearTimeout(onMouseHoverRef.current);
                onMouseHoverRef.current = null;
            }
            if (showOnHover && isOpen) {
                onMouseHoverRef.current = setTimeout(() => setIsOpen(false), debounceOnHover);
                return onMouseHoverRef.current;
            }
        }

        return (
            <div className="cometchat">
                <div className="cometchat-popover">
                    <div
                        ref={childRef}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            if (!showOnHover) {
                                if (childClickHandler) {
                                    childClickHandler(togglePopover, e);
                                } else {
                                    return togglePopover();
                                }
                            }
                        }}
                        className="cometchat-popover__button"
                        onMouseEnter={onPopoverMouseEnter}
                        onMouseLeave={onPopoverMouseLeave }
                    >
                        {children}
                    </div>
                    {isOpen &&
                        <div
                            ref={popoverRef}
                            style={positionStyleState}
                            className="cometchat-popover__content">
                            {content}
                        </div>
                    }
                </div>
            </div>
        );
    }
)

export { CometChatPopover };