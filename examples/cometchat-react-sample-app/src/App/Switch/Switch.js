import * as styles from "./Styles";

export const Switch = (props) => {

    const {
        title,
        switch1,
        switch2,
        activeTab,
        setActiveTab,
        theme
    } = props;

    return (
        <div className="switch__button" style={styles.switchButtonsStyle(theme)}>
            <span className="mode__title" style={styles.modeTitleStyle(theme)}>{title}</span>
            <ul className="tab__list" style={styles.tabListStyle(theme)}>
                <li
                    className="tab"
                    onClick={() => setActiveTab(switch1)}
                    style={styles.modeStyle(theme, switch1, activeTab)}
                >
                    {switch1}
                </li>
                <li
                    className="tab"
                    onClick={() => setActiveTab(switch2)}
                    style={styles.modeStyle(theme, switch2, activeTab)}
                >
                    {switch2}
                </li>
            </ul>
        </div>
    )
}