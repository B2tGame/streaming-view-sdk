import React, { Component } from "react";
import EmulatorScreen from "./src/components/emulator_screen";
import { EmulatorControllerService } from "./src/components/emulator/net/emulator_web_client";
import RoundTripTimeMonitor from "./src/components/round_trip_time_monitor";

const qs = require("qs");
const rp = require("request-promise");

/**
 * StreamingView class is responsible to control all the edge node stream behaviors.
 *
 * @class StreamingView
 * @extends {Component}
 */
export default class StreamingView extends Component {
  static propTypes = {
    apiEndpoint: String,
    edgeNodeId: String,
    enableControl: Boolean,
    enableFullScreen: Boolean,
  };

  constructor(props) {
    super(props);

    this.state = {
      isReadyStream: undefined,
      loadTimeLimit: 120,
      retryCount: 0,
    };
    console.log("PROPS:", props);

    const { apiEndpoint, edgeNodeId } = props;
    const grpc = `${apiEndpoint}/${edgeNodeId}`;
    console.log("grpc:", grpc);
    this.emulator = new EmulatorControllerService(grpc);

    this.pollStreamStatus(apiEndpoint, edgeNodeId, this.state.loadTimeLimit);
  }

  pollStreamStatus(apiEndpoint, edgeNodeId, maxRetry) {
    this.setState({ retryCount: this.state.retryCount + 1 });
    console.log("getting stream status...");
    rp({
      method: "GET",
      uri: `${apiEndpoint}/api/streaming-games/status/${edgeNodeId}`,
      json: true,
    })
      .then((result) => {
        console.log("Request promise result:", result);
        if (result.state === "ready") {
          console.log("Edge Node Stream is 'ready'!");

          this.setState({
            isReadyStream: true,
          });
        } else if (maxRetry) {
          setTimeout(
            () => this.pollStreamStatus(apiEndpoint, edgeNodeId, maxRetry - 1),
            1000
          );
        } else {
          this.setState({
            isReadyStream: false,
          });
        }
      })
      .catch((err) => {
        console.log("Request promise error:", err);
      });
  }

  renderEmulatorBlock() {
    switch (this.state.isReadyStream) {
      case true:
        const { enableControl, enableFullScreen } = this.props;
        return (
          <EmulatorScreen
            emulator={this.emulator}
            enableControl={enableControl}
            enableFullScreen={enableFullScreen}
          />
        );
      case false:
        return <p>EdgeNode Stream is unreachable</p>;
      default:
        return this.props.children;
    }
  }

  render() {
    console.log("StreamingView::render()");
    console.log(
      `Polling EdgeNode Stream; elapsed time: ${this.state.retryCount} seconds`
    );
    return (
      <div>
        <RoundTripTimeMonitor />
        {this.renderEmulatorBlock()}
      </div>
    );
  }
}
