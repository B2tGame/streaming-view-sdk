"use strict";

var _typeof = require("@babel/runtime-corejs3/helpers/typeof");

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _WeakMap = require("@babel/runtime-corejs3/core-js-stable/weak-map");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _Object$getOwnPropertyDescriptor = require("@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set-timeout"));

var _now = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/date/now"));

var _values = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/values"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _findIndex = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/find-index"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/find"));

var _indexOf = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/index-of"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var Proto = _interopRequireWildcard(require("../../../proto/emulator_controller_pb"));

var _EmulatorStatus = _interopRequireDefault(require("../net/EmulatorStatus"));

var _reactDeviceDetect = require("react-device-detect");

var _screenfull = _interopRequireDefault(require("screenfull"));

var _StreamingEvent = _interopRequireDefault(require("../../../StreamingEvent"));

function _getRequireWildcardCache(nodeInterop) { if (typeof _WeakMap !== "function") return null; var cacheBabelInterop = new _WeakMap(); var cacheNodeInterop = new _WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = _Object$defineProperty && _Object$getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? _Object$getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { _Object$defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var ORIENTATION_PORTRAIT = 'portrait';
var ORIENTATION_LANDSCAPE = 'landscape';
/**
 * A handler that extends a view to send key/mouse events to the emulator.
 * It wraps the inner component in a div, and will use the jsep handler
 * to send key/mouse/touch events over the proper channel.
 *
 * It will translate the mouse events based upon the returned display size of
 * the emulator.
 *
 * You usually want to wrap a EmulatorRtcview, or EmulatorPngView in it.
 */

var EventHandler = /*#__PURE__*/function (_Component) {
  (0, _inherits2["default"])(EventHandler, _Component);

  var _super = _createSuper(EventHandler);

  function EventHandler(props) {
    var _this;

    (0, _classCallCheck2["default"])(this, EventHandler);
    _this = _super.call(this, props);

    _this.touchHandler = function (type, allEvents, events, firstChangedEvent) {
      return this.sendMouse(firstChangedEvent, 0);
    };

    _this.handleResize = function () {
      (0, _setTimeout2["default"])(function () {
        _this.forceRender();
      }, 50);
    };

    _this.forceRender = function () {
      _this.setState(_this.state);
    };

    _this.preventDefault = function (event) {
      event.preventDefault();
    };

    _this.handleUserInteraction = function () {
      if ((_this.userInteractionHoldOff || 0) < (0, _now["default"])()) {
        _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].USER_INTERACTION);

        _this.userInteractionHoldOff = (0, _now["default"])() + EventHandler.USER_INTERACTION_HOLD_OFF_TIMEOUT;
      }

      _this.enterFullScreen();
    };

    _this.onContextMenu = function (e) {
      e.preventDefault();
    };

    _this.calculateMouseEmulatorCoordinates = function (event) {
      return _this.calculateEmulatorCoordinates(event.offsetX, event.offsetY, event.target.clientWidth, event.target.clientHeight);
    };

    _this.calculateTouchEmulatorCoordinates = function (event) {
      var elementOffset = event.target.getBoundingClientRect();
      return _this.calculateEmulatorCoordinates(event.clientX - elementOffset.x, event.clientY - elementOffset.y, event.target.clientWidth, event.target.clientHeight);
    };

    _this.sendMouse = function (emulatorCords, mouseButton) {
      var request = new Proto.MouseEvent();
      request.setX(emulatorCords.x);
      request.setY(emulatorCords.y);
      request.setButtons(mouseButton === 0 ? 1 : 0);

      _this.sendInput('mouse', request);
    };

    _this.sendMultiTouch = function (type, allTouchesObject, changedTouchesObject) {
      var _context, _context2, _context3, _context5, _context6;

      var touches = [];
      var allTouches = (0, _values["default"])(allTouchesObject);
      var changedTouches = (0, _values["default"])(changedTouchesObject);

      if (type === 'touchstart' || type === 'touchmove') {
        // Add the current set of changed touches (new started/moved touches)
        touches.push.apply(touches, (0, _toConsumableArray2["default"])((0, _map["default"])(changedTouches).call(changedTouches, function (touch) {
          touch.hasForce = 1;
          return touch;
        })));
      } // Collect all removed touches that are no longer in touchHistory set


      var missingTouches = (0, _filter["default"])(_context = _this.touchHistory).call(_context, function (touch) {
        return (0, _findIndex["default"])(allTouches).call(allTouches, function (t) {
          return t.identifier === touch.identifier;
        }) === -1;
      });
      touches.push.apply(touches, (0, _toConsumableArray2["default"])((0, _map["default"])(missingTouches).call(missingTouches, function (touch) {
        touch.hasForce = 0;
        return touch;
      }))); // Prepare all touch identifiers for existing touch identifiers and add new available touch identifiers (0..9)

      var touchIdentifiers = (0, _reduce["default"])(_context2 = (0, _concat["default"])(_context3 = []).call(_context3, (0, _toConsumableArray2["default"])(allTouches), (0, _toConsumableArray2["default"])(missingTouches))).call(_context2, function (touchIdentifiers, touch) {
        if (_this.touchIdentifiersHistory[touch.identifier] !== undefined) {
          touchIdentifiers[touch.identifier] = _this.touchIdentifiersHistory[touch.identifier];
        } else {
          var _context4;

          var alreadyUsedIdentifiers = (0, _values["default"])(touchIdentifiers);
          var nextFreeIdentifier = (0, _find["default"])(_context4 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).call(_context4, function (identifier) {
            return !((0, _indexOf["default"])(alreadyUsedIdentifiers).call(alreadyUsedIdentifiers, identifier) !== -1);
          });

          if (nextFreeIdentifier !== undefined) {
            touchIdentifiers[touch.identifier] = nextFreeIdentifier;
          }
        }

        return touchIdentifiers;
      }, {});
      var touchesToSend = (0, _map["default"])(_context5 = (0, _concat["default"])(_context6 = []).call(_context6, touches, (0, _toConsumableArray2["default"])(missingTouches))).call(_context5, function (touch) {
        var emulatorCords = _this.calculateTouchEmulatorCoordinates(touch);

        var identifier = touchIdentifiers[touch.identifier];
        var protoTouch = new Proto.Touch();
        protoTouch.setX(emulatorCords.x);
        protoTouch.setY(emulatorCords.y);
        protoTouch.setIdentifier(identifier);
        protoTouch.setPressure(touch.hasForce);
        return protoTouch;
      }); // Make the grpc call.

      var requestTouchEvent = new Proto.TouchEvent();
      requestTouchEvent.setTouchesList(touchesToSend);

      _this.sendInput('touch', requestTouchEvent);

      _this.touchHistory = allTouches;
      _this.touchIdentifiersHistory = touchIdentifiers;
    };

    _this.sendInput = function (label, request) {
      _this.handleUserInteraction();

      if (_this.props.enableControl) {
        _this.props.jsep.send(label, request);
      }
    };

    _this.handleTouchStart = function (event) {
      if (event.cancelable) {
        event.preventDefault();
      }

      _this.touchHandler(event.nativeEvent.type, event.nativeEvent.touches, event.nativeEvent.changedTouches, event.nativeEvent.touches[0]);

      _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].TOUCH_START, _this.calculateTouchEmulatorCoordinates(event.nativeEvent.touches[0]));
    };

    _this.handleTouchEnd = function (event) {
      if (event.cancelable) {
        event.preventDefault();
      }

      _this.touchHandler(event.nativeEvent.type, event.nativeEvent.touches, event.nativeEvent.changedTouches, event.nativeEvent.changedTouches[0]);

      _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].TOUCH_END, _this.calculateTouchEmulatorCoordinates(event.nativeEvent));
    };

    _this.handleTouchMove = function (event) {
      if (event.cancelable) {
        event.preventDefault();
      }

      _this.touchHandler(event.nativeEvent.type, event.nativeEvent.touches, event.nativeEvent.changedTouches, event.nativeEvent.touches[0]);
    };

    _this.handleMouseDown = function (event) {
      if (!_reactDeviceDetect.isMobile) {
        _this.mouseDown = true;

        _this.sendMouse(_this.calculateMouseEmulatorCoordinates(event.nativeEvent), event.button);

        _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].TOUCH_START, _this.calculateTouchEmulatorCoordinates(event.nativeEvent));
      }
    };

    _this.handleMouseUp = function (event) {
      // Don't release mouse when not pressed
      if (!_reactDeviceDetect.isMobile && _this.mouseDown) {
        _this.mouseDown = false;

        _this.sendMouse(_this.calculateMouseEmulatorCoordinates(event.nativeEvent));

        _StreamingEvent["default"].edgeNode(_this.props.edgeNodeId).emit(_StreamingEvent["default"].TOUCH_END, _this.calculateTouchEmulatorCoordinates(event.nativeEvent));
      }
    };

    _this.handleMouseMove = function (event) {
      // Mouse button needs to be pressed before triggering move
      if (!_reactDeviceDetect.isMobile && _this.mouseDown) {
        _this.sendMouse(_this.calculateMouseEmulatorCoordinates(event.nativeEvent), event.button);
      }
    };

    _this.handleKey = function (key) {
      return function (event) {
        // Block sending Alt key, as it opens keyboard
        if (event.key === 'Alt') {
          return;
        }

        var request = new Proto.KeyboardEvent();
        var eventType = key === 'KEYDOWN' ? Proto.KeyboardEvent.KeyEventType.KEYDOWN : key === 'KEYUP' ? Proto.KeyboardEvent.KeyEventType.KEYUP : Proto.KeyboardEvent.KeyEventType.KEYPRESS;
        request.setEventtype(eventType);
        request.setKey(event.key);

        _this.sendInput('keyboard', request);
      };
    };

    _this.preventDragHandler = function (event) {
      event.preventDefault();
    };

    _this.enterFullScreen = function () {
      if (_this.props.enableFullScreen && _screenfull["default"].isEnabled && !_screenfull["default"].isFullscreen) {
        _screenfull["default"].request().then(function () {
          var orientation = _this.props.emulatorWidth > _this.props.emulatorHeight ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT;
          window.screen.orientation.lock(orientation)["catch"](function (error) {
            _this.props.logger.log('Failed to lock screen orientation to: ' + error);
          });
        })["catch"](function (error) {
          _this.props.logger.log('Failed to request fullscreen: ' + error);
        });
      }
    };

    _this.handler = /*#__PURE__*/_react["default"].createRef();
    var emulator = props.emulator;
    _this.status = new _EmulatorStatus["default"](emulator);
    _this.mouseDown = false;
    _this.userInteractionHoldOff = 0;
    _this.touchIdentifiersHistory = {};
    _this.touchHistory = [];
    return _this;
  }

  (0, _createClass2["default"])(EventHandler, [{
    key: "updateTouchHandler",
    value: function updateTouchHandler() {
      this.touchHandler = function (type, allEvents, events, firstChangedEvent) {
        return this.sendMultiTouch(type, allEvents, events);
      };
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      this.updateTouchHandler();
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      this.updateTouchHandler(); // Disabling passive mode to be able to call 'event.preventDefault()' for disabling scroll, which causing
      // laggy touch move performance on mobile phones, since some browsers changed default passive: true from false
      // related issue: https://github.com/facebook/react/issues/9809

      this.handler.current.addEventListener('touchmove', this.preventDefault, {
        passive: false
      });
      window.addEventListener('resize', this.handleResize);
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.handler.current.removeEventListener('touchmove', this.preventDefault, {
        passive: false
      });
      window.removeEventListener('resize', this.handleResize);

      if (this.props.enableFullScreen && _screenfull["default"].isEnabled && _screenfull["default"].isFullscreen) {
        try {
          window.screen.orientation.unlock()["catch"](function () {});
        } catch (e) {// We ignore if the system fails to perform unlock(), typical due to we were not in a locked mode previously,
          // or we are on iOS Safari, where the feature is not supported.
        }
      }
    }
  }, {
    key: "calculateEmulatorCoordinates",
    value:
    /**
     *
     * @param {number} offsetX
     * @param {number} offsetY
     * @param {number} clientWidth
     * @param {number} clientHeight
     * @returns {{x: number, y: number}}
     */
    function calculateEmulatorCoordinates(offsetX, offsetY, clientWidth, clientHeight) {
      /**
       * Calculation and mapping of the coordinates against the emulator screen is done in following steps:
       * 1. Calculate where on the screen active area (the area assigned for the stream to be visible on) the
       *    user click/touch and return it as a percentage value from 0 to 1 in the variable `eventOffset`
       * 2. Identify if the screen is wider or narrower then the emulator for understanding if we have
       *    black border on top/bottom or on the sides, the result is saved into `emulatorIsUsingFullHeight`
       * 3. Dependent if the screen is full height or not the follow steps will be applied:
       *    A: Calculate `scaleFactor` - percentage of how much space the emulator takes
       *       compared to existing space in the active area, eg. if emulator takes up 50 of the screen width we get
       *       a value 0.5 where 25% of the screen on each side is a black border.
       *    B: Convert the `eventOffset` to the real offset after taking into account the emulator did not took
       *       the full space that was available for moving user click/touch position inside the emulator area and then calculate the a value from 0 to 1
       *       within the emulator viewport.
       *    C: Convert and return the values in percentage to the real pixels where the user clicks on using knowledge about
       *       exactly how big the emulator screen is.
       */
      var _this$props = this.props,
          emulatorHeight = _this$props.emulatorHeight,
          emulatorWidth = _this$props.emulatorWidth;
      var eventOffset = {
        x: this.withinInterval(0, offsetX / clientWidth, 1),
        y: this.withinInterval(0, offsetY / clientHeight, 1)
      };
      var emulatorIsUsingFullHeight = emulatorHeight / emulatorWidth > clientHeight / clientWidth;

      if (emulatorIsUsingFullHeight) {
        var scaleFactor = clientHeight * emulatorWidth / (emulatorHeight * clientWidth);
        var scaledTo = Math.round(this.withinInterval(0, (eventOffset.x - 0.5) / scaleFactor + 0.5, 1) * emulatorWidth) || 0;
        return {
          x: this.withinInterval(1, scaledTo, emulatorWidth),
          y: this.withinInterval(1, Math.round(eventOffset.y * emulatorHeight) || 0, emulatorHeight)
        };
      } else {
        var _scaleFactor = clientWidth * emulatorHeight / (emulatorWidth * clientHeight);

        var _scaledTo = Math.round(this.withinInterval(0, (eventOffset.y - 0.5) / _scaleFactor + 0.5, 1) * emulatorHeight) || 0;

        return {
          x: this.withinInterval(1, Math.round(eventOffset.x * emulatorWidth) || 0, emulatorWidth),
          y: this.withinInterval(1, _scaledTo, emulatorHeight)
        };
      }
    }
    /**
     * Get a value and truncate it to always be between the min and max value
     * @param {number} minValue
     * @param {number} value
     * @param {number} maxValue
     * @returns {number}
     */

  }, {
    key: "withinInterval",
    value: function withinInterval(minValue, value, maxValue) {
      return Math.max(Math.min(value, maxValue), minValue);
    }
    /**
     *
     * @param emulatorCords {{x: number, y: number}}
     * @param mouseButton
     */

  }, {
    key: "render",
    value: function render() {
      var View = this.props.view;
      return /*#__PURE__*/_react["default"].createElement("div", {
        onMouseDown: this.handleMouseDown,
        onMouseMove: this.handleMouseMove,
        onMouseUp: this.handleMouseUp,
        onMouseOut: this.handleMouseUp,
        onKeyDown: this.handleKey('KEYDOWN'),
        onKeyUp: this.handleKey('KEYUP'),
        onTouchStart: this.handleTouchStart,
        onTouchEnd: this.handleTouchEnd,
        onTouchMove: this.handleTouchMove,
        onDragStart: this.preventDragHandler,
        tabIndex: "0",
        ref: this.handler,
        style: {
          pointerEvents: 'all',
          outline: 'none',
          margin: '0',
          padding: '0',
          border: '0',
          display: 'inline-block',
          width: '100%',
          height: '100%'
        }
      }, /*#__PURE__*/_react["default"].createElement(View, this.props));
    }
  }], [{
    key: "USER_INTERACTION_HOLD_OFF_TIMEOUT",
    get:
    /**
     * The minimum amount of time the SDK should wait before sending next USER_INTERACTION event
     * @return {number}
     */
    function get() {
      return 500;
    }
  }]);
  return EventHandler;
}(_react.Component);

exports["default"] = EventHandler;
EventHandler.propTypes = {
  emulator: _propTypes["default"].object.isRequired,
  jsep: _propTypes["default"].object.isRequired,
  enableControl: _propTypes["default"].bool,
  enableFullScreen: _propTypes["default"].bool,
  logger: _propTypes["default"].object.isRequired,
  emulatorWidth: _propTypes["default"].number,
  emulatorHeight: _propTypes["default"].number,
  emulatorVersion: _propTypes["default"].string,
  view: _propTypes["default"].any.isRequired,
  edgeNodeId: _propTypes["default"].string.isRequired,
  // report events during the streaming view.
  volume: _propTypes["default"].number,
  muted: _propTypes["default"].bool,
  measureTouchRtt: _propTypes["default"].bool
};
EventHandler.defaultProps = {
  emulatorHeight: 768,
  emulatorWidth: 432
};