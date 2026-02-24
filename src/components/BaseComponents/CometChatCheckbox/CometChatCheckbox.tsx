import { useId } from "react";
import { useCometChatCheckbox } from "./useCometChatCheckbox";
interface CheckboxProps {
    /* default value of the check-box. */
    checked?: boolean;
    /* text to be displayed for the check-box label. */
    labelText?: string;
    /* flag used for enabling/diisabling the button. */
    disabled?: boolean;
    /* callback which is triggered on check-box value is changed. */
    onCheckBoxValueChanged: (input: { checked: boolean, labelText: string | undefined }) => void;
    /** Optional unique id for the checkbox */
    id?: string;
}

/* 
    CometChatCheckbox is a generic component generally used for check-box input. 
    It accepts "labelText" for the text to be displayed with the check-box, and a callback function that is triggered when the check-box value is changed.
*/
const CometChatCheckbox = (props: CheckboxProps) => {
    const {
        checked = false,
        labelText = "",
        disabled = false,
        onCheckBoxValueChanged = () => { },
        id: providedId,
    } = props;

    const generatedId = useId();
    const checkboxId = providedId || `checkbox-${generatedId}`;
    const { updateCheckbox, isChecked } = useCometChatCheckbox({ checked, onCheckBoxValueChanged });

    return (
        <div className="cometchat">
            <div className="cometchat-checkbox">
                <label className="cometchat-checkbox__label" htmlFor={checkboxId}>
                    <input
                        id={checkboxId}
                        type="checkbox"
                        onChange={updateCheckbox}
                        disabled={disabled}
                        checked={isChecked}
                        aria-checked={isChecked}
                        aria-disabled={disabled}
                    />
                    <span className="cometchat-checkbox__checkmark" aria-hidden="true"></span>
                    {labelText}
                </label>
            </div>
        </div>
    )
}

export { CometChatCheckbox };