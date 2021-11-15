"use strict";

var _Reflect$construct = require("@babel/runtime-corejs3/core-js-stable/reflect/construct");

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = void 0;

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/filter"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/object/keys"));

var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/map"));

var _reduce = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/reduce"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/getPrototypeOf"));

var _PredictGameExperienceBase = _interopRequireDefault(require("./PredictGameExperienceBase"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * PredictGameExperienceWithNeuralNetwork class
 */
var PredictGameExperienceWithNeuralNetwork = /*#__PURE__*/function (_PredictGameExperienc) {
  (0, _inherits2["default"])(PredictGameExperienceWithNeuralNetwork, _PredictGameExperienc);

  var _super = _createSuper(PredictGameExperienceWithNeuralNetwork);

  /**
   *
   *  @param {*} json Brain.js network to use.
   */
  function PredictGameExperienceWithNeuralNetwork(json) {
    var _this;

    (0, _classCallCheck2["default"])(this, PredictGameExperienceWithNeuralNetwork);
    _this = _super.call(this);
    _this.network = _this.toFunction(json, function (key) {
      return key === 'score';
    });
    _this.resultBufferSize = json.outputSampling;
    _this.inputBufferSize = json.samplingSize;
    _this.inputBuffer = [];
    _this.resultBuffer = [];
    return _this;
  }
  /**
   * Convert a brain.js network into a function, based on brain.NeuralNetwork::toFunction source code.
   * @param {*} json Brain.js network to use.
   * @param {Function} filter Filter function for select only a subset of the network to be calculated.
   * @return {Function}
   */


  (0, _createClass2["default"])(PredictGameExperienceWithNeuralNetwork, [{
    key: "toFunction",
    value: function toFunction(json, filter) {
      var _context6;

      var needsVar = false;

      function nodeHandle(layers, layerNumber, nodeKey) {
        if (layerNumber === 0) {
          return typeof nodeKey === 'string' ? "(input['".concat(nodeKey, "']||0)") : '(input['.concat(nodeKey, ']||0)');
        }

        var layer = layers[layerNumber];
        var node = layer[nodeKey];
        var result = ['(', node.bias];

        for (var w in node.weights) {
          if (node.weights[w] < 0) {
            var _context;

            result.push((0, _concat["default"])(_context = ''.concat(node.weights[w], '*')).call(_context, nodeHandle(layers, layerNumber - 1, w)));
          } else {
            var _context2;

            result.push((0, _concat["default"])(_context2 = '+'.concat(node.weights[w], '*')).call(_context2, nodeHandle(layers, layerNumber - 1, w)));
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
              var _context3;

              needsVar = true;
              return (0, _concat["default"])(_context3 = '((v='.concat(result.join(''), ')<0?0:')).call(_context3, json.leakyReluAlpha, '*v)');
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

      var layers = json.layers;
      var layersAsMath = [];
      var result;

      for (var i in layers[layers.length - 1]) {
        layersAsMath.push(nodeHandle(layers, layers.length - 1, i));
      }

      if (json.outputLookup) {
        var _context4;

        var outputLookupKeys = (0, _filter["default"])(_context4 = (0, _keys["default"])(layers[layers.length - 1])).call(_context4, filter);
        result = '{'.concat((0, _map["default"])(outputLookupKeys).call(outputLookupKeys, function (key, i) {
          var _context5;

          return (0, _concat["default"])(_context5 = "'".concat(key, "':")).call(_context5, layersAsMath[i]);
        }), '}');
      } else {
        result = '['.concat(layersAsMath.join(','), ']');
      }

      var source = (0, _concat["default"])(_context6 = ''.concat(needsVar ? 'var v;' : '', 'return ')).call(_context6, result, ';'); // eslint-disable-next-line no-new-func

      return new Function('input', source);
    }
    /**
     * Predict the current game experience
     * @param {number} roundTripTime
     * @return {undefined|number}
     */

  }, {
    key: "predict",
    value: function predict(roundTripTime) {
      // Convert RTT to a value between 0 and 1, where 1 is 500 ms, everything above it will be truncated to 500 ms.
      var roundTripTimeValue = Math.max(Math.min(roundTripTime / 500, 1), 0);
      this.inputBuffer.push(roundTripTimeValue);

      if (this.inputBuffer.length > this.inputBufferSize) {
        var _context7;

        this.inputBuffer.shift();
        var rawResult = this.network(this.inputBuffer);
        this.resultBuffer.push(rawResult.score * 4 + 1);

        if (this.resultBuffer.length > this.resultBufferSize) {
          this.resultBuffer.shift();
        }

        var finalResult = (0, _reduce["default"])(_context7 = this.resultBuffer).call(_context7, function (c, v) {
          return c + v;
        }, 0) / this.resultBuffer.length;
        return Math.min(Math.max(finalResult, 1), 5); // Truncate value into range 1-5
      } else {
        return undefined;
      }
    }
  }]);
  return PredictGameExperienceWithNeuralNetwork;
}(_PredictGameExperienceBase["default"]);

exports["default"] = PredictGameExperienceWithNeuralNetwork;