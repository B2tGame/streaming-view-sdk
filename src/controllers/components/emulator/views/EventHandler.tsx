import React, { Component, ComponentClass } from 'react';
import Proto from '../../../proto/emulator_controller_pb.js';
import EmulatorStatus from '../net/EmulatorStatus.js';
import { isMobile } from 'react-device-detect';
import screenfull from 'screenfull';
import * as StreamingEvent from '../../../StreamingEvent.js';
import JsepProtocol from '../net/JsepProtocol.js';
import { Logger } from '../../../../measurements/Logger.js';
import { EmulatorControllerService } from '../../../proto/emulator_web_client.js';

const ORIENTATION_PORTRAIT = 'portrait';
const ORIENTATION_LANDSCAPE = 'landscape';

type EventHandlerProps = {
  emulator: EmulatorControllerService;
  jsep: JsepProtocol;
  enableControl?: boolean;
  enableFullScreen?: boolean;
  logger: Logger;
  emulatorWidth: number;
  emulatorHeight: number;
  emulatorVersion: string;
  view: ComponentClass;
  edgeNodeId: string; // report events during the streaming view.
  volume: number;
  muted?: boolean;
  measureTouchRtt?: boolean;
};

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

type StreamingTouchEvent = Proto.Touch & { identifier: number; hasForce: 0 | 1; target: HTMLDivElement };

export default class EventHandler extends Component<EventHandlerProps> {
  /**
   * The minimum amount of time the SDK should wait before sending next USER_INTERACTION event
   * @return {number}
   */
  static get USER_INTERACTION_HOLD_OFF_TIMEOUT() {
    return 500;
  }

  handler = React.createRef<HTMLDivElement>();
  status = new EmulatorStatus(this.props.emulator);
  mouseDown = false;
  userInteractionHoldOff = 0;
  touchIdentifiersHistory: { [key: number]: number } = {};
  touchHistory: StreamingTouchEvent[] = [];

  static defaultProps = {
    emulatorHeight: 768,
    emulatorWidth: 432,
  };

  constructor(props: EventHandlerProps) {
    super(props);
    this.handler = React.createRef();
    const { emulator } = props;
    this.status = new EmulatorStatus(emulator);
    this.mouseDown = false;
    this.userInteractionHoldOff = 0;
    this.touchIdentifiersHistory = {};
    this.touchHistory = [];
  }

  touchHandler = function (type: string, allEvents: TouchList, events: TouchList, firstChangedEvent: Touch) {
    return this.sendMouse(firstChangedEvent, 0);
  };

  updateTouchHandler() {
    this.touchHandler = function (type, allEvents, events) {
      return this.sendMultiTouch(type, allEvents, events);
    };
  }

  componentDidUpdate() {
    this.updateTouchHandler();
  }

  componentDidMount() {
    this.updateTouchHandler();
    // Disabling passive mode to be able to call 'event.preventDefault()' for disabling scroll, which causing
    // laggy touch move performance on mobile phones, since some browsers changed default passive: true from false
    // related issue: https://github.com/facebook/react/issues/9809
    this.handler.current?.addEventListener('touchmove', this.preventDefault, { passive: false });
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    this.handler.current?.removeEventListener('touchmove', this.preventDefault, {});
    window.removeEventListener('resize', this.handleResize);
    if (this.props.enableFullScreen && screenfull.isEnabled && screenfull.isFullscreen) {
      try {
        window.screen.orientation
          .unlock()
          // @ts-ignore if it's not a promise, it's not supported
          .catch(() => {});
      } catch (e) {
        // We ignore if the system fails to perform unlock(), typical due to we were not in a locked mode previously,
        // or we are on iOS Safari, where the feature is not supported.
      }
    }
  }

  handleResize = () => {
    window.setTimeout(() => {
      this.forceRender();
    }, 50);
  };

  forceRender = () => {
    this.setState(this.state);
  };

  preventDefault = (event: Event) => {
    event.preventDefault();
  };

  handleUserInteraction = () => {
    if ((this.userInteractionHoldOff || 0) < Date.now()) {
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(StreamingEvent.USER_INTERACTION);
      this.userInteractionHoldOff = Date.now() + EventHandler.USER_INTERACTION_HOLD_OFF_TIMEOUT;
    }
    this.enterFullScreen();
  };

  onContextMenu = (e: Event) => {
    e.preventDefault();
  };

  /**
   *
   * @param event
   */
  calculateMouseEmulatorCoordinates = (event: Omit<MouseEvent, 'target'> & { target: HTMLDivElement }) => {
    return this.calculateEmulatorCoordinates(event.offsetX, event.offsetY, event.target!.clientWidth, event.target!.clientHeight);
  };

  /**
   *
   * @param event
   */
  calculateTouchEmulatorCoordinates = (event: Omit<Touch, 'target'> & { target: HTMLDivElement }) => {
    const elementOffset = event.target.getBoundingClientRect();
    return this.calculateEmulatorCoordinates(
      // @ts-ignore
      event.clientX - elementOffset.x,
      // @ts-ignore
      event.clientY - elementOffset.y,
      event.target.clientWidth,
      event.target.clientHeight
    );
  };

  /**
   *
   * @param offsetX
   * @param offsetY
   * @param clientWidth
   * @param clientHeight
   */
  calculateEmulatorCoordinates(offsetX: number, offsetY: number, clientWidth: number, clientHeight: number) {
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
    const { emulatorHeight, emulatorWidth } = this.props;
    const eventOffset = {
      x: this.withinInterval(0, offsetX / clientWidth, 1),
      y: this.withinInterval(0, offsetY / clientHeight, 1),
    };
    const emulatorIsUsingFullHeight = emulatorHeight / emulatorWidth > clientHeight / clientWidth;
    if (emulatorIsUsingFullHeight) {
      const scaleFactor = (clientHeight * emulatorWidth) / (emulatorHeight * clientWidth);
      const scaledTo = Math.round(this.withinInterval(0, (eventOffset.x - 0.5) / scaleFactor + 0.5, 1) * emulatorWidth) || 0;
      return {
        x: this.withinInterval(1, scaledTo, emulatorWidth),
        y: this.withinInterval(1, Math.round(eventOffset.y * emulatorHeight) || 0, emulatorHeight),
      };
    } else {
      const scaleFactor = (clientWidth * emulatorHeight) / (emulatorWidth * clientHeight);
      const scaledTo = Math.round(this.withinInterval(0, (eventOffset.y - 0.5) / scaleFactor + 0.5, 1) * emulatorHeight) || 0;
      return {
        x: this.withinInterval(1, Math.round(eventOffset.x * emulatorWidth) || 0, emulatorWidth),
        y: this.withinInterval(1, scaledTo, emulatorHeight),
      };
    }
  }

  /**
   * Get a value and truncate it to always be between the min and max value
   * @param minValue
   * @param value
   * @param maxValue
   */
  withinInterval(minValue: number, value: number, maxValue: number) {
    return Math.max(Math.min(value, maxValue), minValue);
  }

  /**
   *
   * @param emulatorCords
   * @param mouseButton
   */
  sendMouse = (emulatorCords: { x: number; y: number }, mouseButton: number) => {
    const request = new Proto.MouseEvent();
    request.setX(emulatorCords.x);
    request.setY(emulatorCords.y);
    request.setButtons(mouseButton === 0 ? 1 : 0);
    this.sendInput('mouse', request);
  };

  sendMultiTouch = (
    type: string,
    allTouchesObject: { [id: number]: StreamingTouchEvent },
    changedTouchesObject: { [id: number]: StreamingTouchEvent }
  ) => {
    const touches = [];
    const allTouches = Object.values(allTouchesObject);
    const changedTouches = Object.values(changedTouchesObject);

    if (type === 'touchstart' || type === 'touchmove') {
      // Add the current set of changed touches (new started/moved touches)
      touches.push(
        ...changedTouches.map((touch) => {
          touch.hasForce = 1;
          return touch;
        })
      );
    }
    // Collect all removed touches that are no longer in touchHistory set
    const missingTouches = this.touchHistory.filter((touch) => allTouches.findIndex((t) => t.identifier === touch.identifier) === -1);
    touches.push(
      ...missingTouches.map((touch) => {
        touch.hasForce = 0;
        return touch;
      })
    );

    // Prepare all touch identifiers for existing touch identifiers and add new available touch identifiers (0..9)
    const touchIdentifiers = [...allTouches, ...missingTouches].reduce((touchIdentifiers, touch) => {
      if (this.touchIdentifiersHistory[touch.identifier] !== undefined) {
        touchIdentifiers[touch.identifier] = this.touchIdentifiersHistory[touch.identifier];
      } else {
        const alreadyUsedIdentifiers = Object.values(touchIdentifiers);
        const nextFreeIdentifier = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find(
          (identifier) => !(alreadyUsedIdentifiers.indexOf(identifier) !== -1)
        );
        if (nextFreeIdentifier !== undefined) {
          touchIdentifiers[touch.identifier] = nextFreeIdentifier;
        }
      }
      return touchIdentifiers;
    }, {} as { [key: number]: number });

    const touchesToSend = [...touches, ...missingTouches].map((touch) => {
      // @ts-ignore
      const emulatorCords = this.calculateTouchEmulatorCoordinates(touch);
      const identifier = touchIdentifiers[touch.identifier];
      const protoTouch = new Proto.Touch();
      protoTouch.setX(emulatorCords.x);
      protoTouch.setY(emulatorCords.y);
      protoTouch.setIdentifier(identifier);
      protoTouch.setPressure(touch.hasForce);
      return protoTouch;
    });

    // Make the grpc call.
    const requestTouchEvent = new Proto.TouchEvent();
    requestTouchEvent.setTouchesList(touchesToSend);
    this.sendInput('touch', requestTouchEvent);
    this.touchHistory = allTouches;
    this.touchIdentifiersHistory = touchIdentifiers;
  };

  /**
   * Send input if input control was enabled
   * @param label Input type can be [mouse|keyboard/touch]
   * @param request
   */
  sendInput = (label: 'mouse' | 'keyboard' | 'touch', request: any) => {
    this.handleUserInteraction();
    if (this.props.enableControl) {
      this.props.jsep.send(label, request);
    }
  };

  handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.cancelable) {
      event.preventDefault();
    }
    this.touchHandler(event.nativeEvent.type, event.nativeEvent.touches, event.nativeEvent.changedTouches, event.nativeEvent.touches[0]);
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(
      StreamingEvent.TOUCH_START,
      // @ts-ignore
      this.calculateTouchEmulatorCoordinates(event.nativeEvent.touches[0])
    );
  };

  handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.cancelable) {
      event.preventDefault();
    }
    this.touchHandler(
      event.nativeEvent.type,
      event.nativeEvent.touches,
      event.nativeEvent.changedTouches,
      event.nativeEvent.changedTouches[0]
    );
    StreamingEvent.edgeNode(this.props.edgeNodeId).emit(
      StreamingEvent.TOUCH_END,
      // @ts-ignore
      this.calculateTouchEmulatorCoordinates(event.nativeEvent)
    );
  };

  handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.cancelable) {
      event.preventDefault();
    }
    this.touchHandler(event.nativeEvent.type, event.nativeEvent.touches, event.nativeEvent.changedTouches, event.nativeEvent.touches[0]);
  };

  // Properly handle the mouse events.
  handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMobile) {
      this.mouseDown = true;
      // @ts-ignore
      this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent), event.button);
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(
        StreamingEvent.TOUCH_START,
        // @ts-ignore
        this.calculateTouchEmulatorCoordinates(event.nativeEvent)
      );
    }
  };

  handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    // Don't release mouse when not pressed
    if (!isMobile && this.mouseDown) {
      this.mouseDown = false;
      // @ts-ignore
      this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent));
      StreamingEvent.edgeNode(this.props.edgeNodeId).emit(
        StreamingEvent.TOUCH_END,
        // @ts-ignore
        this.calculateTouchEmulatorCoordinates(event.nativeEvent)
      );
    }
  };

  handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // Mouse button needs to be pressed before triggering move
    if (!isMobile && this.mouseDown) {
      // @ts-ignore
      this.sendMouse(this.calculateMouseEmulatorCoordinates(event.nativeEvent), event.button);
    }
  };

  handleKey = (key: string) => {
    return (event: React.KeyboardEvent) => {
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

  preventDragHandler = (event: React.SyntheticEvent<any, Event>) => {
    event.preventDefault();
  };

  enterFullScreen = () => {
    if (this.props.enableFullScreen && screenfull.isEnabled && !screenfull.isFullscreen) {
      screenfull
        .request()
        .then(() => {
          const orientation = this.props.emulatorWidth > this.props.emulatorHeight ? ORIENTATION_LANDSCAPE : ORIENTATION_PORTRAIT;
          window.screen.orientation.lock(orientation).catch((error) => {
            this.props.logger.info('Failed to lock screen orientation to: ' + error);
          });
        })
        .catch((error: Error) => {
          this.props.logger.info('Failed to request fullscreen: ' + error);
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
        tabIndex={0}
        ref={this.handler}
        style={{
          pointerEvents: 'all',
          outline: 'none',
          margin: '0',
          padding: '0',
          border: '0',
          display: 'inline-block',
          width: '100%',
          height: '100%',
        }}
      >
        <View {...this.props} />
      </div>
    );
  }
}
