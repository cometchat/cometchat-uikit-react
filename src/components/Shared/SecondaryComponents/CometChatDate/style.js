export const textStyle = (props) => {

    return {
        font: props?.style?.textFont,
        color: props?.style?.textColor,
        backgroundColor: props?.style?.background,
        textAlign: 'center',
    }
}