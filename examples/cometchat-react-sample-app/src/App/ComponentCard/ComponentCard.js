import { Link } from "react-router-dom";
import * as styles from "./Styles";

export const ComponentCard = (props) => {

    const {
        title,
        content,
        onClick,
        icon,
        redirectURL,
        theme
    } = props;

    if (redirectURL) {
        return (

            <div className="cards" style={styles.cardWrapperStyle(theme)} >
                <Link to={redirectURL} style={styles.cardStyle(theme)}>
                    <img src={icon} style={styles.iconStyle(theme, icon)} />
                    <div className="right__content" style={styles.cardInfoStyle()}>
                        <span className="card__title" style={styles.cardTitleStyle(theme)}>{title}</span>
                        <div className="card__description" style={styles.cardDescriptionStyle(theme)}>{content}</div>
                    </div>
                </Link>
            </div>
        )
    } else {
        return (
            <div className="cards" style={styles.cardWrapperStyle(theme)}>
                <div style={styles.cardStyle(theme)} onClick={onClick?.bind(this)}>
                    <img src={icon} style={styles.iconStyle(theme, icon)} />
                    <div className="right__content" style={styles.cardInfoStyle()}>
                        <span className="card__title" style={styles.cardTitleStyle(theme)}>{title}</span>
                        <div className="card__description" style={styles.cardDescriptionStyle(theme)}>{content}</div>
                    </div>
                </div>
            </div>
        )
    }
}