"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var Queue = /*#__PURE__*/function () {
  // TODO: annotate type explicitly
  function Queue(amqp, queue, options, worker) {
    (0, _classCallCheck2["default"])(this, Queue);
    (0, _assert["default"])(typeof queue === 'string', "The 'queue' param is required");
    this.queue = queue;
    this.AMQP = amqp;

    if (worker) {
      this.done = this.registerWorker(options, worker);
    }
  }

  (0, _createClass2["default"])(Queue, [{
    key: "ready",
    value: function ready() {
      return this.done;
    }
  }, {
    key: "send",
    value: function send(message) {
      var confirm = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      return this.AMQP.send(this.queue, message, confirm);
    }
  }, {
    key: "registerWorker",
    value: function () {
      var _registerWorker = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(options, worker) {
        var _options, prefetch, retryDelay;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                // Make options optional
                if (typeof options === 'function') {
                  worker = options;
                  options = {
                    prefetch: 1,
                    retryDelay: 60000
                  };
                }

                _options = options, prefetch = _options.prefetch, retryDelay = _options.retryDelay;
                _context.next = 4;
                return this.AMQP.registerWorker(this.queue, worker, prefetch, retryDelay);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function registerWorker(_x, _x2) {
        return _registerWorker.apply(this, arguments);
      }

      return registerWorker;
    }()
  }]);
  return Queue;
}();

exports["default"] = Queue;