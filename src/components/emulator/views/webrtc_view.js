/*
 * Copyright 2019 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import JsepProtocolDriver from '../net/jsep_protocol_driver.js';
import * as Proto from '../../../android_emulation_control/emulator_controller_pb.js';
import EmulatorStatus from '../net/emulator_status';
import { isMobile, isIOS } from 'react-device-detect';
import screenfull from 'screenfull';

var qs = require('qs');

/**
 * A view on the emulator that is using WebRTC. It will use the Jsep protocol over gRPC to
 * establish the video streams. Mouse & key events will be send of data channels.
 */
export default class EmulatorWebrtcView extends Component {
  static propTypes = {
    emulator: PropTypes.object, // emulator service
    enableControl: PropTypes.bool,
    enableFullScreen: PropTypes.bool,
  };

  state = {
    mouse: {
      xp: 0,
      yp: 0,
      mouseDown: false, // Current state of mouse
      // Current button pressed.
      // In proto, 0 is "no button", 1 is left, and 2 is right.
      mouseButton: 0,
    },
    screenOrientation: 'portrait',
  };

  constructor(props) {
    super(props);

    this.containerRef = React.createRef();
    this.updateScales = this.updateScales.bind(this);
  }

  componentDidMount = () => {
    console.log('EmulatorWebrtcView !!! --> componentDidMount');
    this.saveQueryParamsToState();
    this.getEmulatorStatus();
    this.getScreenSize();
    this.jsep = new JsepProtocolDriver(this.props.emulator, this.onConnect);
    this.jsep.startStream();
    this.updateScales();
    window.addEventListener('resize', this.updateScales);
  };

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateScales);
  }

  saveQueryParamsToState() {
    const queryParams = qs.parse(window.location.search, { ignoreQueryPrefix: true }) || {};
    const screenOrientation = ['portrait', 'landscape'].includes(queryParams.so)
      ? queryParams.screenOrientation
      : 'portrait';
    const fps = queryParams.fps;

    this.setState({
      screenOrientation: screenOrientation,
    });

    if (Math.sign(fps) && fps >= 10 && fps <= 60) {
      this.setState({ fps: fps });
    }
  }

  sendJsepEvent(label, msg) {
    if (this.props.enableControl) {
      try {
        this.jsep.send(label, msg);
      } catch (e) {}
    }
  }

  updateScales() {
    // device's original with and height
    const { deviceWidth, deviceHeight } = this.state;
    const deviceRatio = deviceHeight / deviceWidth;

    // window's dimensions contains the black spots when you are in desktop and mouse mode
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    const innerRatio = innerHeight / innerWidth;

    // the ratios are off when we have black spots around the stream
    const isOffRatio = Math.round(innerRatio * 100) !== Math.round(deviceRatio * 100);

    // we need to recalculate the scales when we are in off ration mode
    const emulatorWith = innerHeight / deviceRatio;
    const emulatorHeight = innerWidth * deviceRatio;

    // original scales in touch mode
    let scaleX = innerWidth / deviceWidth;
    let scaleY = innerHeight / deviceHeight;

    if (isOffRatio) {
      if (innerRatio < deviceRatio) {
        // we have a wide screen with empty space next to the emulator stream
        scaleX = emulatorWith / deviceWidth;
      } else {
        // we have a narrow screen with empty space above and under the emulator stream
        scaleY = emulatorHeight / deviceHeight;
      }
    }
    setTimeout(() => {
      this.setState({
        innerWidth,
        innerHeight,
        scaleX,
        scaleY,
        deviceRatio,
        innerRatio,
        isOffRatio,
        emulatorWith,
        emulatorHeight,
      });
    }, 20);
  }

  getEmulatorStatus() {
    const emulatorStatus = new EmulatorStatus(this.props.emulator);
    emulatorStatus.updateStatus((state) => {
      console.log('Emulator State:', state);
      this.setState({});
    });
  }

  getScreenSize() {
    const { emulator } = this.props;
    const state = new EmulatorStatus(emulator);
    state.updateStatus((state) => {
      this.setState({
        deviceWidth: parseInt(state.hardwareConfig['hw.lcd.width']) || this.props.width,
        deviceHeight: parseInt(state.hardwareConfig['hw.lcd.height']) || this.props.height,
      });
    });
  }

  onConnect = (stream) => {
    console.log('Connecting video stream: ' + this.video + ':' + this.video.readyState);
    this.video.srcObject = stream;
    // Kick off playing in case we already have enough data available.
    this.video.play();
  };

  onCanPlay = (event) => {
    if (!this.containerRef.current) {
      console.log('Container was unmounted!');
      return;
    }

    this.applyTrackConstraints()
      .then(() => {
        return this.video.play();
      })
      .then(() => {
        console.log('Automatic playback started!');
      })
      .catch((error) => {
        // Autoplay is likely disabled in chrome
        // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
        // so we should probably show something useful here.
        // We explicitly set the video stream to muted, so this shouldn't happen,
        // but is something you will have to fix once enabling audio.
        alert('code: ' + error.code + ', msg: ' + error.message + ', name: ' + error.nane);
      });
  };

  /**
   * Apply track Constraints for setting width/height/fps.. for the media stream
   * Verifying constraints can be done by calling following methods on stream track:
   * getSettings() | getConstraints() | getCapabilities()
   *
   * Note: Verification can be done after short timeout not immediately after apply
   *
   * @returns {Promise<{*}>}
   */
  applyTrackConstraints = () => {
    if (this.state.fps) {
      let constraints = {
        frameRate: {
          min: this.state.fps,
          max: this.state.fps,
        },
      };

      return this.video.srcObject.getTracks()[0].applyConstraints(constraints);
    }

    return Promise.resolve();
  };

  // Don't show content menu on right mouse click
  onContextMenu = (event) => {
    event.preventDefault();
  };

  handleOffScreenCase = (xp, yp, isOffScreen) => {
    const {
      deviceRatio,
      innerRatio,
      isOffRatio,
      innerWidth,
      innerHeight,
      emulatorWith,
      emulatorHeight,
      scaleX,
      scaleY,
    } = this.state;

    if (scaleX === undefined || isNaN(scaleX)) {
      this.updateScales();
    }

    if (isOffRatio) {
      if (innerRatio < deviceRatio) {
        // we have a wide screen with empty space next to the emulator stream
        const emulatorStarX = Math.round((innerWidth - emulatorWith) / 2);
        const emulatorEndX = innerWidth - emulatorStarX;
        isOffScreen = xp < emulatorStarX || xp > emulatorEndX;
        xp -= emulatorStarX;
      } else {
        // we have a narrow screen with empty space above and under the emulator stream
        const emulatorStarY = Math.round((innerHeight - emulatorHeight) / 2);
        const emulatorEndY = innerHeight - emulatorStarY;
        isOffScreen = yp < emulatorStarY || yp > emulatorEndY;
        yp -= emulatorStarY;
      }
    }

    return {
      xp: Math.round(xp / scaleX),
      yp: Math.round(yp / scaleY),
      isOffScreen: isOffScreen,
    };
  };

  setCoordinates = () => {
    let isOffScreen = false;
    let { xp, yp } = this.state.mouse;
    const { mouseDown, mouseButton } = this.state.mouse;
    ({ xp, yp, isOffScreen } = this.handleOffScreenCase(xp, yp, isOffScreen));

    if (isOffScreen) {
      return;
    }

    // Make the grpc call.
    let request = new Proto.MouseEvent();
    request.setX(xp);
    request.setY(yp);
    request.setButtons(mouseDown ? mouseButton : 0);
    this.sendJsepEvent('mouse', request);
  };

  setTouchCoordinates = (touches) => {
    let identifierForSafari = 0;
    const touchesToSend = Object.keys(touches)
      .map((index) => {
        const touch = touches[index];
        const { clientX, clientY, radiusX, radiusY } = touch;
        let { identifier } = touch;
        // Iphone Safari triggering touch events with negative identifiers like (-1074001159) and identifiers
        // are different for every touch (same for touch move), what breaking execution of touch events
        if (isIOS) {
          identifier = identifierForSafari++;
        }

        let xp = clientX;
        let yp = clientY;

        let isOffScreen = false;
        ({ xp, yp, isOffScreen } = this.handleOffScreenCase(xp, yp, isOffScreen));

        if (isOffScreen) {
          return undefined;
        }

        const protoTouch = new Proto.Touch();
        protoTouch.setX(xp);
        protoTouch.setY(yp);
        protoTouch.setIdentifier(identifier);
        protoTouch.setPressure(1);

        const touchMinor = Math.round(Math.max(2, Math.min(2 * radiusX, 2 * radiusY)));
        protoTouch.setTouchMinor(touchMinor);

        const touchMajor = Math.round(Math.max(2 * radiusX, 2 * radiusY, 10));
        protoTouch.setTouchMajor(touchMajor);

        return protoTouch;
      })
      .filter((value) => value !== undefined);

    // Make the grpc call.
    const requestTouchEvent = new Proto.TouchEvent();
    requestTouchEvent.setTouchesList(touchesToSend);

    this.sendJsepEvent('touch', requestTouchEvent);
  };

  handleKey = (eventType) => {
    return (event) => {
      var request = new Proto.KeyboardEvent();
      if (eventType === 'KEYDOWN') {
        request.setEventtype(Proto.KeyboardEvent.KeyEventType.KEYDOWN);
      } else {
        request.setEventtype(
          eventType === 'KEYUP' ? Proto.KeyboardEvent.KeyEventType.KEYUP : Proto.KeyboardEvent.KeyEventType.KEYPRESS
        );
      }
      request.setKey(event.key);
      this.sendJsepEvent('keyboard', request);
    };
  };

  // Properly handle the mouse events.
  handleMouseDown = (event) => {
    if (isMobile) {
      return;
    }

    this.enterFullScreen();
    const { offsetX, offsetY } = event.nativeEvent;
    this.setState(
      {
        mouse: {
          xp: offsetX,
          yp: offsetY,
          mouseDown: true,
          // In browser's MouseEvent.button property,
          // 0 stands for left button and 2 stands for right button.
          mouseButton: event.button === 0 ? 1 : event.button === 2 ? 2 : 0,
        },
      },
      this.setCoordinates
    );
  };

  handleMouseUp = (event) => {
    if (isMobile) {
      return;
    }

    const { offsetX, offsetY } = event.nativeEvent;
    this.setState(
      {
        mouse: {
          xp: offsetX,
          yp: offsetY,
          mouseDown: false,
          mouseButton: 0,
        },
      },
      this.setCoordinates
    );
  };

  handleMouseMove = (event) => {
    if (isMobile || !this.state.mouse.mouseDown) {
      return;
    }

    const { offsetX, offsetY } = event.nativeEvent;
    const mouse = this.state.mouse;
    mouse.xp = offsetX;
    mouse.yp = offsetY;
    this.setState({ mouse: mouse }, this.setCoordinates);
  };

  preventDragHandler = (event) => {
    event.preventDefault();
  };

  handleTouchStart = (event) => {
    this.enterFullScreen();
    this.setTouchCoordinates(event.nativeEvent.touches);
  };

  handleTouchMove = (event) => {
    this.enterFullScreen();
    this.setTouchCoordinates(event.nativeEvent.touches);
  };

  handleTouchEnd = (event) => {
    this.enterFullScreen();
    const protoTouch = new Proto.Touch();
    protoTouch.setX(0);
    protoTouch.setY(0);
    protoTouch.setIdentifier(0);
    protoTouch.setPressure(0);
    protoTouch.setTouchMajor(0);
    protoTouch.setTouchMinor(0);

    // Make the grpc call.
    const requestTouchEvent = new Proto.TouchEvent();
    requestTouchEvent.setTouchesList([protoTouch]);
    this.sendJsepEvent('touch', requestTouchEvent);
  };

  enterFullScreen = () => {
    if (this.props.enableFullScreen && !screenfull.isFullscreen) {
      screenfull
        .request()
        .then(() => {
          window.screen.orientation.lock(this.state.screenOrientation).catch((error) => {
            console.log('Failed to lock screen orientation to:', error);
          });
        })
        .catch((error) => {
          console.log('Failed to request fullscreen:', error);
        });
    }
  };

  render() {
    return (
      <div>
        <div
          id='container'
          ref={this.containerRef}
          // Handle mouse interaction
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
          onMouseOut={this.handleMouseUp}
          // Handle key interaction
          onKeyDown={this.handleKey('KEYDOWN')}
          onKeyUp={this.handleKey('KEYUP')}
          // Handle touch interaction
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
          onTouchMove={this.handleTouchMove}
          // onTouchCancel={this.handleTouch}
          // onTouchStartCapture={this.handleTouch}
          // onTouchEndCapture={this.handleTouch}
          // onTouchMoveCapture={this.handleTouch}
          // onTouchCancelCapture={this.handleTouch}

          onDragStart={this.preventDragHandler}
          tabIndex='0'
        >
          <video
            ref={(node) => (this.video = node)}
            width={this.state.innerWidth}
            height={this.state.innerHeight}
            muted='muted'
            onContextMenu={this.onContextMenu}
            onCanPlay={this.onCanPlay}
            playsInline
          />
        </div>
      </div>
    );
  }
}
