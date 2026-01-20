import { useCometChatCheckbox } from "./useCometChatCheckbox";
interface CheckboxProps {
    /* default value of the check-box. */
    checked?: boolean;
    /* text to be displayed for the check-box label. */
    labelText?: string;
    /* flag used for enabling/diisabling the button. */
    disabled?: boolean;
    /* callback which is triggered on check-box value is changed. */
    onCheckBoxValueChanged: (input: { checked: boolean, labelText: string | undefined, shiftKey?: boolean, metaKey?: boolean }) => void;
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
    } = props;

    const { updateCheckbox, isChecked, handleClick } = useCometChatCheckbox({ checked, onCheckBoxValueChanged });

    return (
        <div className="cometchat">
            <div className="cometchat-checkbox">
                <label className="cometchat-checkbox__label">
                    <input id="checkbox-id" type="checkbox" onChange={updateCheckbox} onClick={handleClick} disabled={disabled} checked={isChecked} />
                    <span className="cometchat-checkbox__checkmark"></span>
                    {labelText}
                </label>
            </div>
        </div>
    )
}

export { CometChatCheckbox };