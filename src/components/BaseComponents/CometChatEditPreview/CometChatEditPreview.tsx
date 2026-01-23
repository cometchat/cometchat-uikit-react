import { FC } from 'react';
import {getLocalizedString} from '../../../resources/CometChatLocalize/cometchat-localize';

/**
 * Interface for the props used in the CometChatEditPreview component.
 */
interface EditPreviewProps {
    /** The title to display in the preview, defaults to "Edit Message"*/
    previewTitle?: string;
    /** The subtitle to display in the preview, can be left empty. */
    previewSubtitle?: string;
    /** Callback function that triggers when the close button is clicked. */
    onClose?: () => void;
}

/**
 * CometChatEditPreview Component
 *
 * A React component that displays a preview of an edited message with a title and subtitle.
 * @param {EditPreviewProps} props - The props for the component.
 * @returns {JSX.Element} A JSX element displaying the edit preview UI.
 */
const CometChatEditPreview: FC<EditPreviewProps> = ({
    previewTitle = getLocalizedString("message_composer_edit_message"),
    previewSubtitle = "",
    onClose,
}) => {
    return (
        <div className="cometchat" style={{
            width: "100%"
        }}>
            <div className="cometchat-edit-preview">
                <p className="cometchat-edit-preview__title" >{previewTitle}</p>
                <p className="cometchat-edit-preview__subtitle">{previewSubtitle}</p>
                <div
                    className="cometchat-edit-preview__close"
                    onClick={onClose}
                />
            </div>
        </div>
    );
};

export { CometChatEditPreview };
