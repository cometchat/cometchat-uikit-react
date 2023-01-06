/**
 * @class Styles
 * @description Styles class is used for defining the basic styles .
 * @param {String} width
 * @param {String} height
 * @param {String} background
 * @param {String} border
 * @param {String} borderRadius
 * @param {String} activeBackground
 */

 class BaseStyles {
    constructor({
        width = "100%",
        height = "100%",
        background = "",
        border = "",
        borderRadius = "",
        activeBackground = ""
    }) {
        this.width = width;
        this.height = height;
        this.background = background;
        this.border = border;
        this.borderRadius = borderRadius;
        this.activeBackground = activeBackground;

    }
}
export { BaseStyles };
