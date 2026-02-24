import { MouseEvent } from "react";
import LoadingIcon from '../../../assets/loading_animation.svg'
interface ButtonProps {
    text?: string,
    hoverText?: string,
    iconURL?: string,
    disabled?: boolean,
    isLoading?: boolean,
    onClick?: (customEvent: CustomEvent<{ event: PointerEvent }>) => void,
    /** Accessible label for the button, required when button has no visible text */
    ariaLabel?: string,
};

const CometChatButton = (props: ButtonProps) => {
    const {
        text,
        hoverText,
        iconURL,
        disabled,
        isLoading = false,
        onClick = () => { },
        ariaLabel,
    } = props;

    // Determine accessible label: explicit ariaLabel > hoverText > text
    const accessibleLabel = ariaLabel || hoverText || text || "Button";

    return (
        <div className="cometchat">
            <button
                type="button"
                onMouseUp={(event) => event?.stopPropagation()}
                onMouseDown={(event) => event?.stopPropagation()}
                className="cometchat-button"
                title={hoverText}
                onClick={(event: CustomEvent<{ event: PointerEvent }> & MouseEvent<HTMLButtonElement>) => onClick(event)}
                disabled={disabled || isLoading}
                aria-label={!text ? accessibleLabel : undefined}
                aria-busy={isLoading}
                aria-disabled={disabled || isLoading}
            >
                {isLoading ? (
                    <img src={LoadingIcon} alt="" aria-hidden="true" className="cometchat-button__loading-view" />


                ) : (
                    <>
                        <div
                            style={iconURL ? { WebkitMask: `url(${iconURL}) center center no-repeat` } : undefined}
                            className={`${iconURL ? "cometchat-button__icon-default cometchat-button__icon" : "cometchat-button__icon"}`}
                            aria-hidden="true"
                        />
                        {text && <label className="cometchat-button__text">{text}</label>}
                    </>
                )}
            </button>
        </div>
    );
};

export { CometChatButton };
