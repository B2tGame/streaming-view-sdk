import Emulator from './emulator/emulator.js';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * This class is responsible to display the emulator component
 */
class EmulatorScreen extends React.Component {
  static propTypes = {
    emulator: PropTypes.object, // emulator service
    enableControl: PropTypes.bool,
    enableFullScreen: PropTypes.bool,
  };

  render() {
    const { emulator, enableControl, enableFullScreen } = this.props;
    return <Emulator emulator={emulator} enableControl={enableControl} enableFullScreen={enableFullScreen} />;
  }
}

export default EmulatorScreen;
