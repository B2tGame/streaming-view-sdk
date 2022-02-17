# Streaming View SDK

This contains a set of React components that can be used to interact with a stream of the android emulator from the
browser.

[Full reference](#full-reference)

## Usage StreamingView

You can connect to the remote stream as follows:

```js
import { StreamingView } from 'streaming-view-sdk';

class App extends React.Component {
  render() {
    return (
      <StreamingView
        apiEndpoint={'https://exampe.com/api/streaming-service'}
        edgeNodeId={'a8a363c7-7104-4a40-9908-c4122d15f902'}
        enableControl={true}
        enableFullScreen={false}
      >
        <!--
        Here you can place a component or elements that should
        be displayed until the streaming view is ready.
        -->
      </StreamingView>
    );
  }
}
```

## Usage StreamingController

You can shut down an edge node with the StreamingController

```js
import { StreamingController } from 'streaming-view-sdk';

StreamingController({
  apiEndpoint: 'https://exampe.com/api/streaming-service',
  edgeNodeId: 'a8a363c7-7104-4a40-9908-c4122d15f902'
})
  .then((streamingController) => streamingController.terminate())
  .then(console.log)
  .catch(console.error);
```

## Full Reference

### Streaming View

A React component that displays and controls a remote stream from the android emulator.

#### Supported properties

| prop                 | type      | default | required           | description                                                                                                                             |
|----------------------|-----------|---------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| **
apiEndpoint**      | `String`  |         | :white_check_mark: | API endpoint the component should use to connect to the Streaming Service API.                                                          |
| **
edgeNodeId**       | `String`  |         | :white_check_mark: | Edge Node Id received from GET: Create API endpoint, and can't bedynamically changed during runtime.                                    |
| **
enableControl**    | `Boolean` | `true`  | :x:                | Enable/disable user interactions with the game, can be dynamically changed during runtime.                                              |
| **
enableFullScreen** | `Boolean` | `true`  | :x:                | The app will put the stream in full-screen mode after the first user interaction.                                                       |
| **
volume**           | `Number`  | `1.0`   | :x:                | Volume has the following range: [0.0...1.0]. Volume 0.0 means audio is muted, volume 1.0 is maximum volume and 0.5 means 50% of volume. |

### Streaming controller

A class that controls the stream

#### Supported properties

| prop            | type     | default | required           | description                                                                                           |
|-----------------|----------|---------|--------------------|-------------------------------------------------------------------------------------------------------|
| **
apiEndpoint** | `String` |         | :white_check_mark: | API endpoint the component should use to connect to the Streaming Service API.                        |
| **
edgeNodeId**  | `String` |         | :white_check_mark: | Edge Node Id received from GET: Create API endpoint, and can't be dynamically changed during runtime. |

#### Functions

- terminate()
  Terminates the instance returns a promise with the result

### How Sync protobuf definitions

For the update of protobuf definition, that define the shared API between the web client and the Android Emulator do the
following steps:

1. Download https://dl.google.com/android/repository/emulator-linux-XXXXX.zip
2. Copy all `.proto` and `.protobuf` found in `/lib` (in the zip file) folder into `/protobuf-definition` folder in this
   project.

### How to generate proto files

Run shell script:

```
./build-sdk.sh
```

## How to run tests
 ```sh
   npm test
   ```
   
### Last Commit Id of merged Google repository

[d9aa985ab40790050dd8c28ce34d8e05cb386750](https://github.com/google/android-emulator-webrtc/commit/d9aa985ab40790050dd8c28ce34d8e05cb386750)
