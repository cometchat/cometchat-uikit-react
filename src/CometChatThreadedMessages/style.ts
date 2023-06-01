import { CSSProperties } from "react"

export const ThreadedMessagesWrapperStyle = () => {
    return {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: "border-box"
    } as CSSProperties
}

export const ThreadedMessagesHeaderStyle = () => {
    return {
        height: '6%',
        width: '100%',
        display: 'flex',
        padding: '8px',
        alignItems: 'flex-start',
        flex: '0 0 auto'
    }
}

export const ThreadedMessagesCloseButtonStyle = () => {
    return {
        display: 'flex',
        alignItems: 'center'
    }
}

export const ThreadedMessagesTitleStyle = () => {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '95%'
    }
}

export const ThreadedMessagesBubbleViewStyle = () => {
    return {
        width: 'fit-content',
        // height: "8%"
    } as CSSProperties
}
  
export const ThreadedMessagesActionViewStyle = () => {
    return {
        height: "3%"
    } as CSSProperties
}

export const ThreadedMessagesListStyle = () => {
    return {
        height: "74%",
        overflowY: "auto",
        width: '100%'
    } as CSSProperties
}

export const ThreadedMessagesComposerStyle = () => {
    return {
        height: "8%",
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
    } as CSSProperties
}
  
  