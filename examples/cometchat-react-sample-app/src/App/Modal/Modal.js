import * as styles from "./Styles";
import closeIconURL from "../assets/Plus-1.png";

export const Modal = (props) => {

    const {
        title,
        width,
        renderDetails,
        onClose,
        theme
    } = props;

    return (
        <div className="backdrop" style={styles.backdropStyle(theme)}>
            <div className="container" style={styles.wrapperStyle(theme, width)}>
                <div className="header" style={styles.headerStyle(theme)}>
                    <span className="title" style={styles.titleStyle(theme)}>{title}</span>
                    <div className="close__icon" style={styles.closeIconStyle(theme, closeIconURL)} onClick={onClose.bind(this)}></div>
                </div>

                <div className="details" style={styles.detailsWrapper(theme)}>
                    {renderDetails()}
                </div>
            </div>
        </div>
    )
}