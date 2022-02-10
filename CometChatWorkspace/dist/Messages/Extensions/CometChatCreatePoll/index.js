"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatCreatePoll = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../");

var _2 = require("../../");

var _CometChatContext = require("../../../../util/CometChatContext");

var _style = require("./style");

var _creating = _interopRequireDefault(require("./resources/creating.svg"));

var _addCircleFilled = _interopRequireDefault(require("./resources/add-circle-filled.svg"));

var _close = _interopRequireDefault(require("./resources/close.svg"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var CometChatCreatePoll = /*#__PURE__*/function (_React$Component) {
  (0, _inherits2.default)(CometChatCreatePoll, _React$Component);

  var _super = _createSuper(CometChatCreatePoll);

  function CometChatCreatePoll(props) {
    var _this;

    (0, _classCallCheck2.default)(this, CometChatCreatePoll);
    _this = _super.call(this, props);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "loggedInUser", null);
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "addPollOption", function () {
      var options = (0, _toConsumableArray2.default)(_this.state.options);
      options.push({
        value: "",
        id: new Date().getTime()
      });

      _this.setState({
        options: options
      });
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "removePollOption", function (option) {
      var options = (0, _toConsumableArray2.default)(_this.state.options);
      var optionKey = options.findIndex(function (opt) {
        return opt.id === option.id;
      });

      if (optionKey > -1) {
        options.splice(optionKey, 1);

        _this.setState({
          options: options
        });
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "optionChangeHandler", function (event, option) {
      var options = (0, _toConsumableArray2.default)(_this.state.options);
      var optionKey = options.findIndex(function (opt) {
        return opt.id === option.id;
      });

      if (optionKey > -1) {
        var newOption = _objectSpread(_objectSpread({}, option), {}, {
          value: event.target.value
        });

        options.splice(optionKey, 1, newOption);

        _this.setState({
          options: options
        });
      }
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)(_this), "createPoll", function () {
      var question = _this.questionRef.current.value.trim();

      var firstOption = _this.optionOneRef.current.value.trim();

      var secondOption = _this.optionTwoRef.current.value.trim();

      var optionItems = [firstOption, secondOption];

      if (question.length === 0) {
        _this.setState({
          errorMessage: (0, _2.localize)("INVALID_POLL_QUESTION")
        });

        return false;
      }

      if (firstOption.length === 0 || secondOption.length === 0) {
        _this.setState({
          errorMessage: (0, _2.localize)("INVALID_POLL_OPTION")
        });

        return false;
      }

      _this.state.options.forEach(function (option) {
        optionItems.push(option.value);
      });

      var receiverId;
      var receiverType = _this.context.type;

      if (_this.context.type === _chat.CometChat.RECEIVER_TYPE.USER) {
        receiverId = _this.context.item.uid;
      } else if (_this.context.type === _chat.CometChat.RECEIVER_TYPE.GROUP) {
        receiverId = _this.context.item.guid;
      }

      _this.setState({
        creatingPoll: true,
        errorMessage: ""
      });

      _chat.CometChat.callExtension('polls', 'POST', 'v2/create', {
        "question": question,
        "options": optionItems,
        "receiver": receiverId,
        "receiverType": receiverType
      }).then(function (response) {
        if (response && response.hasOwnProperty("success") && response["success"] === true) {
          _this.setState({
            creatingPoll: false
          }); //this.props.actionGenerated(enums.ACTIONS["POLL_CREATED"]);


          _this.props.onSubmit();
        } else {
          _this.setState({
            errorMessage: (0, _2.localize)("SOMETHING_WRONG")
          });
        }
      }).catch(function (error) {
        _this.setState({
          creatingPoll: false
        });

        _this.setState({
          errorMessage: (0, _2.localize)("SOMETHING_WRONG")
        });
      });
    });
    _this.state = {
      errorMessage: "",
      options: [],
      creatingPoll: false
    };
    _this.questionRef = /*#__PURE__*/_react.default.createRef();
    _this.optionOneRef = /*#__PURE__*/_react.default.createRef();
    _this.optionTwoRef = /*#__PURE__*/_react.default.createRef();
    _this.optionRef = /*#__PURE__*/_react.default.createRef();
    return _this;
  }

  (0, _createClass2.default)(CometChatCreatePoll, [{
    key: "render",
    value: function render() {
      var _this2 = this;

      var optionList = (0, _toConsumableArray2.default)(this.state.options);
      var pollOptionView = optionList.map(function (option, index) {
        return /*#__PURE__*/_react.default.createElement(_.CometChatCreatePollOptions, {
          key: index,
          option: option,
          tabIndex: index + 4,
          lang: _this2.props.lang,
          optionChangeHandler: _this2.optionChangeHandler,
          removePollOption: _this2.removePollOption
        });
      });
      var createText = this.state.creatingPoll ? (0, _2.localize)("CREATING") : (0, _2.localize)("CREATE");
      return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_2.CometChatBackdrop, {
        show: true,
        clicked: this.props.onClose
      }), /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.modalWrapperStyle)(this.context),
        className: "modal__createpoll"
      }, /*#__PURE__*/_react.default.createElement("span", {
        style: (0, _style.modalCloseStyle)(_close.default, this.context),
        className: "modal__close",
        onClick: this.props.onClose,
        title: (0, _2.localize)("CLOSE")
      }), /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.modalBodyStyle)(),
        className: "modal__body"
      }, /*#__PURE__*/_react.default.createElement("table", {
        style: (0, _style.modalTableStyle)(this.context)
      }, /*#__PURE__*/_react.default.createElement("caption", {
        style: (0, _style.tableCaptionStyle)(),
        className: "modal__title"
      }, (0, _2.localize)("CREATE_POLL")), /*#__PURE__*/_react.default.createElement("tbody", {
        style: (0, _style.tableBodyStyle)()
      }, /*#__PURE__*/_react.default.createElement("tr", {
        className: "error"
      }, /*#__PURE__*/_react.default.createElement("td", {
        colSpan: "3"
      }, /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.modalErrorStyle)(this.context)
      }, this.state.errorMessage))), /*#__PURE__*/_react.default.createElement("tr", {
        className: "poll__question"
      }, /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _2.localize)("QUESTION"))), /*#__PURE__*/_react.default.createElement("td", {
        colSpan: "2"
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "text",
        autoFocus: true,
        tabIndex: "1",
        placeholder: (0, _2.localize)("ENTER_YOUR_QUESTION"),
        ref: this.questionRef
      }))), /*#__PURE__*/_react.default.createElement("tr", {
        className: "poll__options"
      }, /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _2.localize)("OPTIONS"))), /*#__PURE__*/_react.default.createElement("td", {
        colSpan: "2"
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "text",
        tabIndex: "2",
        placeholder: (0, _2.localize)("ENTER_YOUR_OPTION"),
        ref: this.optionOneRef
      }))), /*#__PURE__*/_react.default.createElement("tr", {
        ref: this.optionRef,
        className: "poll__options"
      }, /*#__PURE__*/_react.default.createElement("td", null, "\xA0"), /*#__PURE__*/_react.default.createElement("td", {
        colSpan: "2"
      }, /*#__PURE__*/_react.default.createElement("input", {
        type: "text",
        tabIndex: "3",
        placeholder: (0, _2.localize)("ENTER_YOUR_OPTION"),
        ref: this.optionTwoRef
      }))), pollOptionView, /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", null, "\xA0"), /*#__PURE__*/_react.default.createElement("td", null, /*#__PURE__*/_react.default.createElement("label", null, (0, _2.localize)("ADD_NEW_OPTION"))), /*#__PURE__*/_react.default.createElement("td", {
        style: (0, _style.iconWrapperStyle)()
      }, /*#__PURE__*/_react.default.createElement("i", {
        tabIndex: "100",
        style: (0, _style.addOptionIconStyle)(_addCircleFilled.default),
        className: "option__add",
        onClick: this.addPollOption
      })))), /*#__PURE__*/_react.default.createElement("tfoot", {
        style: (0, _style.tableFootStyle)(this.state, _creating.default)
      }, /*#__PURE__*/_react.default.createElement("tr", {
        className: "createpoll"
      }, /*#__PURE__*/_react.default.createElement("td", {
        colSpan: "2"
      }, /*#__PURE__*/_react.default.createElement("button", {
        type: "button",
        onClick: this.createPoll
      }, /*#__PURE__*/_react.default.createElement("span", null, createText)))))))));
    }
  }]);
  return CometChatCreatePoll;
}(_react.default.Component); // Specifies the default values for props:


exports.CometChatCreatePoll = CometChatCreatePoll;
(0, _defineProperty2.default)(CometChatCreatePoll, "contextType", _CometChatContext.CometChatContext);
CometChatCreatePoll.defaultProps = {};
CometChatCreatePoll.propTypes = {};