/**
 * @class DateConfiguration 
 * @description DateConfiguration class is used for defining the date template
 * @param {String} pattern
 * @param {String} customPattern
 */

class DateConfiguration{
  constructor({
    pattern = "timeFormat",
    customPattern = null,
    
  }) {
    this.pattern = pattern;
    this.customPattern = customPattern;
  }
  };
  
  export { DateConfiguration };