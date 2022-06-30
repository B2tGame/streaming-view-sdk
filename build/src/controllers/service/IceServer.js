"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js-stable/object/define-property");

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.requestIceServers = requestIceServers;

var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/concat"));

var _axios = _interopRequireDefault(require("axios"));

/**
 *
 * @param {string} apiEndpoint
 * @param {string} edgeNodeId
 * @returns {Promise<{ name: string, candidates: [{*}]}>}
 */
function requestIceServers(apiEndpoint, edgeNodeId) {
  var _context;

  return _axios.default.get((0, _concat.default)(_context = "".concat(apiEndpoint, "/api/streaming-games/edge-node/ice-server/edge-node/")).call(_context, edgeNodeId), {
    timeout: 10000
  }).then(function (result) {
    return result.data || {};
  });
}