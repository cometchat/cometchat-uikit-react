"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _react = _interopRequireDefault(require("react"));

var _ = require("../");

var Hooks = function Hooks(props, setName, setAvatar, setImageURL, imageURL) {
  var pickImage = function pickImage(thumbnailGenerationObject) {
    var smallUrl = thumbnailGenerationObject["url_small"];
    var mediumUrl = thumbnailGenerationObject["url_medium"];
    var mq = window.matchMedia(_.BREAKPOINTS[0]);
    var imageToDownload = mediumUrl;

    if (mq.matches) {
      imageToDownload = smallUrl;
    }

    return imageToDownload;
  };

  var downloadImage = function downloadImage(imgUrl) {
    return new Promise(function (resolve, reject) {
      var timer;
      var xhr = new XMLHttpRequest();
      xhr.open("GET", imgUrl, true);
      xhr.responseType = "blob";

      xhr.onload = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            timer = null;
            resolve(imgUrl);
          } else if (xhr.status === 403) {
            timer = setTimeout(function () {
              downloadImage(imgUrl).then(function (response) {
                return resolve(imgUrl);
              }).catch(function (error) {
                return reject(error);
              });
            }, 800);
          }
        } else {
          reject(xhr.statusText);
        }
      };

      xhr.onerror = function (event) {
        return reject(new Error("There was a network error.", event));
      };

      xhr.ontimeout = function (event) {
        return reject(new Error("There was a timeout error.", event));
      };

      xhr.send();
    });
  };

  var setMessageImageUrl = _react.default.useCallback(function () {
    return new Promise(function (resolve) {
      var img = new Image();

      if (props.messageObject && props.messageObject.data && props.messageObject.data.attachments && (0, _typeof2.default)(props.messageObject.data.attachments) === "object" && props.messageObject.data.attachments.length) {
        var _props$messageObject$;

        img.src = (_props$messageObject$ = props.messageObject.data.attachments[0]) === null || _props$messageObject$ === void 0 ? void 0 : _props$messageObject$.url;
      } else if (props.messageObject.data.file && props.messageObject.data.file) {
        var reader = new FileReader();

        reader.onload = function () {
          img.src = reader.result;
        };

        reader.readAsDataURL(props.messageObject.data.file);
      }

      img.onload = function () {
        return resolve(img.src);
      };
    });
  }, [props.messageObject]);

  _react.default.useEffect(function () {
    if (props.userName && props.userName.length) {
      setName(props.userName);
    } else if (props.messageObject && props.messageObject.sender && props.messageObject.sender.name) {
      setName(props.messageObject.sender.name);
    }
  }, [props.userName, props.messageObject, setName]);

  _react.default.useEffect(function () {
    if (props.avatar && props.avatar.length) {
      setAvatar(props.avatar);
    } else if (props.messageObject && props.messageObject.sender) {
      setAvatar(props.messageObject.sender);
    }
  }, [props.avatar, props.messageObject, setAvatar]);

  _react.default.useEffect(function () {
    if (props.imageURL && props.imageURL.length) {
      setImageURL(props.imageURL);
    } else if (props.messageObject) {
      var thumbnailGenerationExtensionData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.thumbnailGeneration);

      if (thumbnailGenerationExtensionData && !thumbnailGenerationExtensionData.hasOwnProperty("error")) {
        var mq = window.matchMedia(_.BREAKPOINTS[0]);
        mq.addListener(function () {
          var imageToDownload = pickImage(thumbnailGenerationExtensionData);
          var img = new Image();
          img.src = imageToDownload;

          img.onload = function () {
            return setImageURL(img.src);
          };
        });
        var imageToDownload = pickImage(thumbnailGenerationExtensionData);
        downloadImage(imageToDownload).then(function (response) {
          var img = new Image();
          img.src = imageToDownload;

          img.onload = function () {
            return setImageURL(img.src);
          };
        }).catch(function (error) {
          return console.error(error);
        });
      } else {
        setMessageImageUrl().then(function (imageUrl) {
          if (imageUrl !== imageURL) {
            setImageURL(imageUrl);
          }
        });
      }
    }
  }, [imageURL, props.imageURL, props.messageObject, setImageURL, setMessageImageUrl]);
};

exports.Hooks = Hooks;