import * as styles from "./Styles";

export const MenuCard = (props) => {
    const {
        title,
        content,
        onClick,
        icon,
        theme
    } = props;

    return (
        <div className="cards" style={styles.cardStyle(theme)} onClick={onClick?.bind(this)}>
            <div className="left__content">
                <span className="title" style={styles.cardTitleStyle(theme)}>{title}</span>
                <div className="description" style={styles.cardDescriptionStyle(theme)}>{content}</div>
            </div>
            <div className="card__icon" style={styles.iconStyle(theme, icon)}></div>
        </div>
    )
}