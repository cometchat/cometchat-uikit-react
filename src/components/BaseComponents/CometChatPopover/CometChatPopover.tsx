import { useState, useRef, useEffect, ReactNode, useCallback, forwardRef, useImperativeHandle, CSSProperties, useLayoutEffect } from 'react';
import { fireClickEvent, isMobileDevice } from '../../../utils/util';
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
    disableBackgroundInteraction?: boolean;
    useParentContainer?: boolean;
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
            disableBackgroundInteraction = false,
            useParentContainer = false
        },
        ref
    ) => {

        const onMouseHoverRef = useRef<any>(null);
        const [isOpen, setIsOpen] = useState(false);
        const [positionStyleState, setPositionStyleState] = useState<CSSProperties>({});
        const popoverRef = useRef<HTMLDivElement>(null);
        const childRef = useRef<HTMLDivElement>(null);
        const parentViewRef = useRef<HTMLDivElement | null>(null);

        useImperativeHandle(ref, () => ({
            openPopover() {
                getPopoverPositionStyle();
                setIsOpen(true);
            },
            closePopover() {
                setIsOpen(false);
            },
        }));
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
        }, [closeOnOutsideClick, isOpen]);
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

        const getAvailablePlacement = useCallback(
            (rect: DOMRect, height: number) => {
              const spaceAbove = rect.top;
              const spaceBelow = window.innerHeight - rect.bottom;
              const spaceLeft = rect.left;
              const spaceRight = window.innerWidth - rect.right;
                        if (useParentContainer) {
                const parentViewRect = parentViewRef.current?.getBoundingClientRect();
                if (!parentViewRect) return placement;
          
                const spaceAboveParent = rect.top - parentViewRect.top;
                const spaceBelowParent = parentViewRect.bottom - rect.bottom;
                const spaceLeftParent = rect.left - parentViewRect.left;
                const spaceRightParent = parentViewRect.right - rect.right;
          
                if (placement === Placement.top && spaceAboveParent >= height + 10) return Placement.top;
                if (placement === Placement.bottom && spaceBelowParent >= height + 10) return Placement.bottom;
                if (placement === Placement.left && spaceLeftParent >= height + 10) return Placement.left;
                if (placement === Placement.right && spaceRightParent >= height + 10) return Placement.right;
          
                if (spaceAboveParent >= height + 10) return Placement.top;
                if (spaceBelowParent >= height + 10) return Placement.bottom;
                if (spaceLeftParent >= height + 10) return Placement.left;
                if (spaceRightParent >= height + 10) return Placement.right;
              }
          
              if (placement === Placement.top && spaceAbove >= height + 10) return Placement.top;
              if (placement === Placement.bottom && spaceBelow >= height + 10) return Placement.bottom;
              if (placement === Placement.left && spaceLeft >= height + 10) return Placement.left;
              if (placement === Placement.right && spaceRight >= height + 10) return Placement.right;
          
              if (spaceAbove >= height + 10) return Placement.top;
              if (spaceBelow >= height + 10) return Placement.bottom;
              if (spaceLeft >= height + 10) return Placement.left;
              if (spaceRight >= height + 10) return Placement.right;
          
              return placement; 
            },
            [placement, useParentContainer]
          );
        
        const calculatePopoverPosition = useCallback(() => {
            if (!popoverRef.current || !childRef.current || !parentViewRef.current) return;
            
            const height = popoverRef.current.scrollHeight;
            const width = popoverRef.current.scrollWidth;
            const rect = childRef.current.getBoundingClientRect();
            const parentViewRect = parentViewRef.current.getBoundingClientRect();
            if (!rect || !parentViewRect) return;
        
            const availablePlacement = getAvailablePlacement(rect, height);
            let positionStyle:CSSProperties = {};
        
            if ([Placement.top, Placement.bottom].includes(availablePlacement)) {
                positionStyle.top = availablePlacement === Placement.top
                    ? `${Math.max(parentViewRect.top, rect.top - height - 10)}px`
                    : `${Math.min(parentViewRect.bottom - height, rect.bottom + 10)}px`;
        
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
        }, [isOpen]);
        
        const getPopoverPositionStyle = useCallback(() => {
            if (useParentContainer) {
                parentViewRef.current = parentViewRef.current || getTopMostCometChatElement() as HTMLDivElement | null;
                calculatePopoverPosition();
                return;
            }
        
            const height = popoverRef.current?.scrollHeight || 0;
            const width = popoverRef.current?.scrollWidth || 0;
            const rect = childRef.current?.getBoundingClientRect();
            if (!rect) return;
            
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const availablePlacement = getAvailablePlacement(rect, height);
            let positionStyle:CSSProperties = {};
        
            if ([Placement.top, Placement.bottom].includes(availablePlacement)) {
                positionStyle.top = availablePlacement === Placement.top
                    ? `${rect.top - height - 10 < 0 ? rect.bottom + 10 : rect.top - height - 10}px`
                    : `${rect.bottom + height + 10 > viewportHeight ? rect.top - height - 10 : rect.bottom + 10}px`;
        
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
        }, [isOpen, positionStyleState, calculatePopoverPosition, useParentContainer]);
        

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

        const getTopMostCometChatElement = (): HTMLElement | undefined => {
            if(!popoverRef.current) return;
            let current = popoverRef.current;
            let topMostElement: HTMLElement | null = null;
            while (current) {
                if (current.classList?.contains('cometchat')) {
                    topMostElement = current;
                }
                current = current.parentElement as HTMLDivElement;
            }
            return topMostElement as HTMLDivElement;
        };
        
        useEffect(() => {
            if(useParentContainer){
                parentViewRef.current = getTopMostCometChatElement() as HTMLDivElement;
            }
        }, [useParentContainer,isOpen]);

        return (
            <div className="cometchat">
                <div className="cometchat-popover">
                {disableBackgroundInteraction && isOpen &&  getFullScreenOverlay()}
                    <div
                            style={{
                                ...(disableBackgroundInteraction && isOpen && {
                                    position: 'relative',
                                    zIndex: 1000,
                                    pointerEvents: 'auto',
                                  }),
                              }}
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
                        onMouseLeave={onPopoverMouseLeave}
                    >
                        {children}
                    </div>
                    {isOpen &&
                        <div
                            ref={popoverRef}
                            style={{
                                ...positionStyleState,
                                ...(disableBackgroundInteraction && isOpen && {
                                    zIndex: 1000,
                                    pointerEvents: 'auto',
                                  }),
                              }}
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