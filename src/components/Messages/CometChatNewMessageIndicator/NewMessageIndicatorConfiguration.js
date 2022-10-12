/**
 * @class newMessageIndicatorConfiguration 
 * @description newMessageIndicator class is used for defining the newMessageIndicator templates.
 * @param {String} Icon
 * @param {function} onClick
 */

class NewMessageIndicatorConfiguration {
    constructor({
        Icon = "",
        onClick = ()=>{},
       
     }) {

        this.Icon = Icon;
        this.onClick = onClick;
       
    }
}

export { NewMessageIndicatorConfiguration };