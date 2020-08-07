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
import React from "react";
import * as Proto from "../../../proto/emulator_controller_pb";
import EmulatorStatus from "../net/emulator_status";

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
export default function withMouseKeyHandler(WrappedComponent) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        deviceHeight: 768,
        deviceWidth: 432,
        windowOffsetX: 8,
        windowOffsetY: 155,
        mouseDown: false,
      };
      this.handler = React.createRef();
      const { emulator } = this.props;
      this.status = new EmulatorStatus(emulator);
    }

    componentDidMount() {
      this.getScreenSize();
    }

    getScreenSize() {
      console.log(this.state.hardwareConfig)
      this.status.updateStatus(state => {
        this.setState({
          deviceWidth: 768,
          deviceHeight: 432
        });
      });
    }

    onContextMenu = e => {
      e.preventDefault();
    };

    convertTouchCoordinates = (touches) => {
      let identifierForSafari = 0;
      const touchCordinates = Object.keys(touches)
        .map((index) => {
          const touch = touches[index];
          const { clientX, clientY, radiusX, radiusY } = touch;
          const { offsetTop, offsetLeft } = this.handler.current;
          let { identifier } = touch;
          const cords = { x: clientX - offsetLeft, y: clientY - offsetTop }
          // Iphone Safari triggering touch events with negative identifiers like (-1074001159) and identifiers
          // are different for every touch (same for touch move), what breaking execution of touch events
          // if (isIOS) {
          //   identifier = identifierForSafari++;
          return cords;
        })
        .filter((value) => value !== undefined)
        .shift();
      return touchCordinates;
    };

    converToEmulatorCordinates = (cords) => {
      const { deviceWidth, deviceHeight } = this.state;
      const { clientHeight, clientWidth } = this.handler.current;
      const scaleX = deviceWidth / clientWidth;
      const scaleY = deviceHeight / clientHeight;
      const x = Math.round(cords.x * scaleX);
      const y = Math.round(cords.y * scaleY);

      return { x, y };
    }
    isEmulatorCordinatesValid = (cords) => {
      const { deviceWidth, deviceHeight } = this.state;
      if (cords.x > deviceWidth || cords.x < 0)
        return false;
      if (cords.y > deviceHeight || cords.y < 0)
        return false;
      return true;

    }
    sendMouse = (cords, mouse) => {
      if (this.isEmulatorCordinatesValid(cords)) {
        var request = new Proto.MouseEvent();
        request.setX(cords.x);
        request.setY(cords.y);
        request.setButtons(mouse);
        const { jsep } = this.props;
        jsep.send("mouse", request);
      } else {
        console.log("None valid cordinates", cords)
      }
    }


    handleTouchStart = e => {
      const screenCords = this.convertTouchCoordinates(e.nativeEvent.touches);
      const emulatorCords = this.converToEmulatorCordinates(screenCords);
      this.sendMouse(emulatorCords, 1);
    };


    handleTouchEnd = e => {
      this.sendMouse({ x: 1, y: 1 }, 0);
    };


    handleTouchMove = e => {
      const screenCords = this.convertTouchCoordinates(e.nativeEvent.touches);
      const emulatorCords = this.converToEmulatorCordinates(screenCords);
      this.sendMouse(emulatorCords, 1);
    };

    // Properly handle the mouse events.
    handleMouseDown = e => {
      this.setState({ mouseDown: true })
      const { offsetX, offsetY } = e.nativeEvent;
      const emulatorCords = this.converToEmulatorCordinates({ x: offsetX, y: offsetY });
      this.sendMouse(emulatorCords, 1)
    };
    handleMouseUp = e => {
      this.setState({ mouseDown: false })
      const { offsetX, offsetY } = e.nativeEvent;
      const emulatorCords = this.converToEmulatorCordinates({ x: offsetX, y: offsetY });
      this.sendMouse(emulatorCords, 0);
    };



    handleMouseMove = e => {
      // Let's not overload the endpoint with useless events.
      if (!this.state.mouseDown)
        return;
      const { offsetX, offsetY } = e.nativeEvent;
      const emulatorCords = this.converToEmulatorCordinates({ x: offsetX, y: offsetY });
      this.sendMouse(emulatorCords, 1);

    };

    preventDragHandler = e => {
      e.preventDefault();
    };

    render() {
      return (
        <div /* handle interaction */
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
          onMouseOut={this.handleMouseUp}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
          onTouchMove={this.handleTouchMove}
          onDragStart={this.preventDragHandler}
          tabIndex="0"
          ref={this.handler}
          style={{
            pointerEvents: "all",
            outline: "none",
            margin: "0",
            padding: "0",
            border: "0",
            display: "inline-block",
            width: "100%"
          }}
        >
          <WrappedComponent {...this.props} />
        </div>
      );
    }
  };
}
