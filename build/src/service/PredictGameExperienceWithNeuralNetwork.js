"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _PredictGameExperienceBase = _interopRequireDefault(require("./PredictGameExperienceBase"));

/**
 * PredictGameExperienceWithNeuralNetwork class
 */
class PredictGameExperienceWithNeuralNetwork extends _PredictGameExperienceBase.default {
  /**
   *
   *  @param {*} json Brain.js network to use.
   */
  constructor(json) {
    super();
    this.network = this.toFunction(json, key => key === 'score');
    this.resultBufferSize = json.outputSampling;
    this.inputBufferSize = json.samplingSize;
    this.inputBuffer = [];
    this.resultBuffer = [];
  }
  /**
   * Convert a brain.js network into a function, based on brain.NeuralNetwork::toFunction source code.
   * @param {*} json Brain.js network to use.
   * @param {Function} filter Filter function for select only a subset of the network to be calculated.
   * @return {Function}
   */


  toFunction(json, filter) {
    let needsVar = false;

    function nodeHandle(layers, layerNumber, nodeKey) {
      if (layerNumber === 0) {
        return typeof nodeKey === 'string' ? "(input['".concat(nodeKey, "']||0)") : '(input['.concat(nodeKey, ']||0)');
      }

      const layer = layers[layerNumber];
      const node = layer[nodeKey];
      const result = ['(', node.bias];

      for (let w in node.weights) {
        if (node.weights[w] < 0) {
          result.push(''.concat(node.weights[w], '*').concat(nodeHandle(layers, layerNumber - 1, w)));
        } else {
          result.push('+'.concat(node.weights[w], '*').concat(nodeHandle(layers, layerNumber - 1, w)));
        }
      }

      result.push(')');

      switch (json.activation) {
        case 'sigmoid':
          {
            return '1/(1+1/Math.exp('.concat(result.join(''), '))');
          }

        case 'relu':
          {
            needsVar = true;
            return '((v='.concat(result.join(''), ')<0?0:v)');
          }

        case 'leaky-relu':
          {
            needsVar = true;
            return '((v='.concat(result.join(''), ')<0?0:').concat(json.leakyReluAlpha, '*v)');
          }

        case 'tanh':
          {
            return 'Math.tanh('.concat(result.join(''), ')');
          }

        default:
          {
            throw new Error('Unknown activation '.concat(json.activation, ". Available activations are: 'sigmoid', 'relu', 'leaky-relu', 'tanh'"));
          }
      }
    }

    const layers = json.layers;
    const layersAsMath = [];
    let result;

    for (var i in layers[layers.length - 1]) {
      layersAsMath.push(nodeHandle(layers, layers.length - 1, i));
    }

    if (json.outputLookup) {
      const outputLookupKeys = Object.keys(layers[layers.length - 1]).filter(filter);
      result = '{'.concat(outputLookupKeys.map((key, i) => {
        return "'".concat(key, "':").concat(layersAsMath[i]);
      }), '}');
    } else {
      result = '['.concat(layersAsMath.join(','), ']');
    }

    const source = ''.concat(needsVar ? 'var v;' : '', 'return ').concat(result, ';'); // eslint-disable-next-line no-new-func

    return new Function('input', source);
  }
  /**
   * Predict the current game experience
   * @param {number} roundTripTime
   * @return {undefined|number}
   */


  predict(roundTripTime) {
    // Convert RTT to a value between 0 and 1, where 1 is 500 ms, everything above it will be truncated to 500 ms.
    const roundTripTimeValue = Math.max(Math.min(roundTripTime / 500, 1), 0);
    this.inputBuffer.push(roundTripTimeValue);

    if (this.inputBuffer.length > this.inputBufferSize) {
      this.inputBuffer.shift();
      const rawResult = this.network(this.inputBuffer);
      this.resultBuffer.push(rawResult.score * 4 + 1);

      if (this.resultBuffer.length > this.resultBufferSize) {
        this.resultBuffer.shift();
      }

      const finalResult = this.resultBuffer.reduce((c, v) => c + v, 0) / this.resultBuffer.length;
      return Math.min(Math.max(finalResult, 1), 5); // Truncate value into range 1-5
    } else {
      return undefined;
    }
  }

}

exports.default = PredictGameExperienceWithNeuralNetwork;