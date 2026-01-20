import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react"

export const useCometChatCheckbox = ({
    checked = false,
    onCheckBoxValueChanged = (input: { checked: boolean, labelText: string | undefined, shiftKey?: boolean, metaKey?: boolean }) => {}
 }) => {
    const [isChecked, setIsChecked] = useState(checked);
    // Use ref instead of state to capture event synchronously (onClick fires before onChange)
    const lastClickEventRef = useRef<{ shiftKey: boolean, metaKey: boolean } | null>(null);

    useEffect(() => {
        setIsChecked(checked);
    }, [checked]);

    /*
        This function captures the mouse event to get shift/meta keys
    */
    const handleClick = (event: MouseEvent<HTMLInputElement>) => {
        lastClickEventRef.current = {
            shiftKey: event.shiftKey,
            metaKey: event.metaKey
        };
    }

    /*
        This function is used to set the value of the check-box on value change.
        It also triggers the callback function with the value and the labeltext of the check-box changed. 
    */
    const updateCheckbox = (event: ChangeEvent<HTMLInputElement>) => {
        // Capture ref values immediately to prevent race conditions from rapid clicks
        // If user clicks multiple times before onChange fires, we preserve the correct modifiers
        const capturedModifiers = lastClickEventRef.current;
        
        // Clear ref immediately to prevent interference with subsequent clicks
        lastClickEventRef.current = null;
        
        setIsChecked(event.target?.checked);
        onCheckBoxValueChanged({ 
            checked: event.target?.checked, 
            labelText: event.target.labels?.[0].innerText,
            shiftKey: capturedModifiers?.shiftKey,
            metaKey: capturedModifiers?.metaKey
        });
    }

    return {
        isChecked,
        updateCheckbox,
        handleClick,
    }
}