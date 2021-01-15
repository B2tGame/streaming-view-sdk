import PropTypes from 'prop-types';
import React, { Component } from 'react';
import * as Proto from '../../../proto/emulator_controller_pb';
import EmulatorStatus from '../net/EmulatorStatus';
import { isMobile } from 'react-device-detect';
import screenfull from 'screenfull';
import StreamingEvent from '../../../StreamingEvent';

const ORIENTATION_PORTRAIT = 'portrait';
const ORIENTATION_LANDSCAPE = 'landscape';

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

export default class EventHandler extends Component {

  /**
   * The minimum amount of time the SDK should wait before sending next USER_INTERACTION event
   * @return {number}
   */
  static get USER_INTERACTION_HOLD_OFF_TIMEOUT() {
    return 500;
  }

  state = {
    deviceHeight: 768,
    deviceWidth: 432
  };

  static propTypes = {
    emulator: PropTypes.object.isRequired,
    jsep: PropTypes.object.isRequired,
    enableControl: PropTypes.bool,
    enableFullScreen: PropTypes.bool,
    logger: PropTypes.object.isRequired,
    emulatorWidth: PropTypes.number,
    emulatorHeight: PropTypes.number,
    emulatorVersion: PropTypes.string,
    view: PropTypes.any.isRequired,
    edgeNodeId: PropTypes.string.isRequired // report events during the streaming view.
  };

  constructor(props) {
    super(props);
    this.handler = React.createRef();
    const { emulator } = props;
    this.status = new EmulatorStatus(emulator);
    this.mouseDown = false;
    this.userInteractionHoldOff = 0;
  }

  touchHandler = function(type, events, firstChangedEvent) {
    return this.sendMouse(firstChangedEvent, 0);
  }

  componentDidUpdate() {
    if (this.props.emulatorVersion !== "emu-30.2.4-android10") {
      this.touchHandler = function(type, events, firstChangedEvent) {
        return this.sendMultiTouch(type, events);
      };
    } else {
      this.touchHandler = function(type, events, firstChangedEvent) {
        this.mouseDown = type !== 'touchend';
        return this.sendMouse(this.calculateTouchEmulatorCoordinates(firstChangedEvent), type !== 'touchend' ? 0 : 1);
      };
    }
  }

  componentDidMount() {
    this.getScreenSize();
    // Disabling passive mode to be able to call 'event.preventDefault()' for disabling scroll, which causing
    // laggy touch move performance on mobile phones, since some browsers changed default passive: true from false
    // related issue: https://github.com/facebook/react/issues/9809
    this.handler.current.addEventListener('touchmove', this.preventDefault, { passive: false });
    window.addEventListener('resize', this.forceRender);
  }

  componentWillUnmount() {
    this.handler.current.removeEventListener('touchmove', this.preventDefault, { passive: false });
    window.removeEventListener('resize', this.forceRender);
    if (this.props.enableFullScreen && screenfull.isEnabled && screenfull.isFullscreen) {
      window.screen.orientation.unlock();
    }
  }

  forceRender = () => {
    this.setState(this.state);
  };

  preventDefault = (event) => {
    event.preventDefault();
  };

  getScreenSize() {
    this.status.updateStatus((state) => {
      this.setState({
        deviceWidth: parseInt(state.hardwareConfig['hw.lcd.width']) || this.state.deviceWidth,
        deviceHeight: parseInt(state.hardwareConfig['hw.lcd.height']) || this.state.deviceHeight
      });
    });
  }

  handleUserInteraction = () => {
    if ((this.userInteractionHoldOff || 0) < Date.now()) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_INTERACTION);
      this.userInteractionHoldOff = Date.now() + EventHandler.USER_INTERACTION_HOLD_OFF_TIMEOUT;
    }
    this.enterFullScreen();
  };

  onContextMenu = (e) => {
    e.preventDefault();
  };

  /**
   *
   * @param event
   * @returns {{x: number, y: number}}
   */
  calculateMouseEmulatorCoordinates = (event) => {
    const { offsetX, offsetY } = event;
    const { clientWidth, clientHeight } = event.target;

    return this.calculateEmulatorCoordinates(offsetX, offsetY, clientWidth, clientHeight);
  };

  /**
   *
   * @param event
   * @returns {{x: number, y: number}}
   */
  calculateTouchEmulatorCoordinates = (event) => {
    const { clientX, clientY } = event;
    const { clientWidth, clientHeight } = event.target;

    // TODO: Improve coordinates to handle cases when video element is not centered in the middle
    // use offsets to get exact coordinates of video (getBoundingClientRect or other method) and do more accurate calculation
    const offsetX = clientX - ((window.innerWidth - clientWidth) / 2);
    const offsetY = clientY - ((window.innerHeight - clientHeight) / 2);

    return this.calculateEmulatorCoordinates(offsetX, offsetY, clientWidth, clientHeight);
  };

  /**
   * Calculate coordinates for the emulator from client offset coordinates
   * @param offsetX
   * @param offsetY
   * @param clientWidth
   * @param clientHeight
   * @returns {{x: number, y: number}}
   */
  calculateEmulatorCoordinates = (offsetX, offsetY, clientWidth, clientHeight) => {
    const xEmulatorCoordinate = (offsetX / clientWidth) * this.state.deviceWidth;
    const yEmulatorCoordinate = (offsetY / clientHeight) * this.state.deviceHeight;

    return {
      x: Math.round(xEmulatorCoordinate),
      y: Math.round(yEmulatorCoordinate)
    };
  };

  /**
   *
   * @param emulatorCords
   * @param mouseButton
   */
  sendMouse = (emulatorCords, mouseButton) => {
    const request = new Proto.MouseEvent();
    request.setX(emulatorCords.x);
    request.setY(emulatorCords.y);
    request.setButtons(mouseButton === 0 ? 1 : 0);

    this.sendInput('mouse', request);
  };

  sendMultiTouch = (type, touches) => {
    const touchesToSend = Object.keys(touches).map((index) => {
      const touch = touches[index];
      const emulatorCords = this.calculateTouchEmulatorCoordinates(touch);

      const { identifier, force } = touch;

      const protoTouch = new Proto.Touch();
      protoTouch.setX(emulatorCords.x);
      protoTouch.setY(emulatorCords.y);
      protoTouch.setIdentifier(identifier);
      protoTouch.setPressure(force > 0 && type !== 'touchend' ? 1 : 0);

      return protoTouch;
    });

    // Make the grpc call.
    const requestTouchEvent = new Proto.TouchEvent();
    requestTouchEvent.setTouchesList(touchesToSend);
    this.sendInput('touch', requestTouchEvent);
  };

  /**
   * Send input if input control was enabled
   * @param label Input type can be [mouse|keyboard/touch]
   * @param request
   */
  sendInput = (label, request) => {
    this.handleUserInteraction();
    if (this.props.enableControl) {
      this.props.jsep.send(label, request);
    }
  };

  handleTouchStart = (event) => {
    if (event.cancelable) {
      event.preventDefault();
    }
    this.touchHandler(event.nativeEvent.type, event.nativeEvent.changedTouches, event.nativeEvent.touches[0])
  };

  handleTouchEnd = (event) => {
    if (event.cancelable) {
      event.preventDefault();
    }
    this.touchHandler(event.nativeEvent.type, event.nativeEvent.changedTouches, event.nativeEvent.changedTouches[0])
  };

  handleTouchMove = (event) => {
    if (event.cancelable) {
      event.preventDefault();
    }
    this.touchHandler(event.nativeEvent.type, event.nativeEvent.changedTouches, event.nativeEvent.touches[0])
  };

  // Properly handle the mouse events.
  handleMouseDown = (event) => {
    if (!isMobile) {
      this.mouseDown = true;
      this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent), event.button);
    }
  };

  handleMouseUp = (event) => {
    // Don't release mouse when not pressed
    if (!isMobile && this.mouseDown) {
      this.mouseDown = false;
      this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent));
    }
  };

  handleMouseMove = (event) => {
    // Mouse button needs to be pressed before triggering move
    if (!isMobile && this.mouseDown) {
      this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent), event.button);
    }
  };

  handleKey = (key) => {
    return (event) => {
      // Block sending Alt key, as it opens keyboard
      if (event.key === 'Alt') {
        return;
      }

      const request = new Proto.KeyboardEvent();
      const eventType =
        key === 'KEYDOWN'
          ? Proto.KeyboardEvent.KeyEventType.KEYDOWN
          : key === 'KEYUP'
          ? Proto.KeyboardEvent.KeyEventType.KEYUP
          : Proto.KeyboardEvent.KeyEventType.KEYPRESS;
      request.setEventtype(eventType);
      request.setKey(event.key);
      this.sendInput('keyboard', request);
    };
  };

  preventDragHandler = (event) => {
    event.preventDefault();
  };

  enterFullScreen = () => {
    if (this.props.enableFullScreen && screenfull.isEnabled && !screenfull.isFullscreen) {
      screenfull
        .request()
        .then(() => {
          const orientation = this.props.emulatorWidth > this.props.emulatorHeight ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT;
          window.screen.orientation.lock(orientation).catch((error) => {
            this.props.logger.log('Failed to lock screen orientation to: ' + error);
          });
        })
        .catch((error) => {
          this.props.logger.log('Failed to request fullscreen: ' + error);
        });
    }
  };

  render() {
    const View = this.props.view;
    return (
      <div
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
        onMouseOut={this.handleMouseUp}
        onKeyDown={this.handleKey('KEYDOWN')}
        onKeyUp={this.handleKey('KEYUP')}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
        onTouchMove={this.handleTouchMove}
        onDragStart={this.preventDragHandler}
        tabIndex='0'
        ref={this.handler}
        style={{
          pointerEvents: 'all',
          outline: 'none',
          margin: '0',
          padding: '0',
          border: '0',
          display: 'inline-block',
          width: '100%'
        }}
      >
        <View
          {...this.props}
          deviceHeight={this.state.deviceHeight}
          deviceWidth={this.state.deviceWidth}
        />
      </div>
    );
  }
}