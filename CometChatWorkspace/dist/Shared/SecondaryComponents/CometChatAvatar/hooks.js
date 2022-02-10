"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var Hooks = function Hooks(setImageURL, props) {
  var generateAvatar = _react.default.useCallback(function () {
    return function (data) {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      canvas.width = 200;
      canvas.height = 200; //Draw background

      context.fillStyle = props.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height); //Draw text

      context.font = props.textFont;
      context.fillStyle = props.textColor;
      context.strokeStyle = "transparent";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(data, canvas.width / 2, canvas.height / 2);
      return canvas.toDataURL("image/svg");
    };
  }, [props]);

  var fetchImage = _react.default.useCallback(function (image) {
    var img = new Image();
    img.src = image;

    img.onload = function () {
      setImageURL(image);
    };
  }, [setImageURL]);

  _react.default.useEffect(function () {
    if (props.image.trim().length) {
      fetchImage(props.image);
    } else if (Object.keys(props.user).length) {
      if (props.user.avatar) {
        fetchImage(props.user.avatar);
      } else {
        var char = props.user.name.substring(0, 2).toUpperCase();
        fetchImage(generateAvatar(char));
      }
    } else if (Object.keys(props.group).length) {
      if (props.group.icon) {
        fetchImage(props.group.icon);
      } else {
        var _char = props.group.name.substring(0, 2).toUpperCase();

        fetchImage(generateAvatar(_char));
      }
    }
  }, [props, generateAvatar, fetchImage]);
};

exports.Hooks = Hooks;