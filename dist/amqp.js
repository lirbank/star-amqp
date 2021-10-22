"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _amqplib = _interopRequireDefault(require("amqplib"));

var _assert = _interopRequireDefault(require("assert"));

var _queue = _interopRequireDefault(require("./queue"));

var AMQP = /*#__PURE__*/function () {
  function AMQP() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        url = _ref.url,
        certificate = _ref.certificate;

    (0, _classCallCheck2["default"])(this, AMQP);
    (0, _assert["default"])(typeof url === 'string', "The 'options.url' param is required");
    this.url = url;
    this.certificate = certificate;
    this.connecting = false;
    this.connection;
    this.producerChannelCreating = false;
    this.producerChannel;
  }

  (0, _createClass2["default"])(AMQP, [{
    key: "Queue",
    get: function get() {
      return _queue["default"].bind(null, this);
    }
  }, {
    key: "ensureConnection",
    value: function () {
      var _ensureConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var options, conn;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.connecting) {
                  _context.next = 6;
                  break;
                }

                _context.next = 3;
                return new Promise(function (r) {
                  return setTimeout(r, 500);
                });

              case 3:
                _context.next = 5;
                return this.ensureConnection();

              case 5:
                return _context.abrupt("return", _context.sent);

              case 6:
                if (!this.connection) {
                  _context.next = 8;
                  break;
                }

                return _context.abrupt("return", this.connection);

              case 8:
                // eslint-disable-next-line no-console
                console.log('★✩★ Connecting to RabbitMQ');
                this.connecting = true;
                options = {};

                if (this.certificate) {
                  options = {
                    ca: [this.certificate]
                  };
                }

                _context.next = 14;
                return _amqplib["default"].connect(this.url, options);

              case 14:
                conn = _context.sent;
                // eslint-disable-next-line no-console
                console.log('★✩★ Connected to RabbitMQ');
                this.connection = conn;
                this.connecting = false;
                return _context.abrupt("return", conn);

              case 19:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function ensureConnection() {
        return _ensureConnection.apply(this, arguments);
      }

      return ensureConnection;
    }()
  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // eslint-disable-next-line no-console
                console.log('★✩★ Disconnecting from RabbitMQ');

                if (!this.connection) {
                  _context2.next = 4;
                  break;
                }

                _context2.next = 4;
                return this.connection.close();

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function close() {
        return _close.apply(this, arguments);
      }

      return close;
    }()
  }, {
    key: "send",
    value: function () {
      var _send = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(q, data) {
        var confirm,
            conn,
            content,
            options,
            producerChannel,
            ok,
            _yield$producerChanne,
            _yield$producerChanne2,
            confirmation,
            _args3 = arguments;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                confirm = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : true;
                _context3.next = 3;
                return this.ensureConnection();

              case 3:
                conn = _context3.sent;

                if (!this.producerChannelCreating) {
                  _context3.next = 10;
                  break;
                }

                _context3.next = 7;
                return new Promise(function (r) {
                  return setTimeout(r, 250);
                });

              case 7:
                _context3.next = 9;
                return this.send(q, data, confirm);

              case 9:
                return _context3.abrupt("return", _context3.sent);

              case 10:
                if (this.producerChannel) {
                  _context3.next = 18;
                  break;
                }

                // eslint-disable-next-line no-console
                console.log('★✩★ Creating RabbitMQ Producer Channel');
                this.producerChannelCreating = true; // NOTE: It's important to use createConfirmChannel() and not
                // createChannel() here, or else sendToQueue() will not have a callback,
                // and we won't be able to create a promise to know if the server has
                // accepted the message (which has caused problems before).

                _context3.next = 15;
                return conn.createConfirmChannel();

              case 15:
                this.producerChannel = _context3.sent;
                // eslint-disable-next-line no-console
                console.log('★✩★ Created RabbitMQ Producer Channel');
                this.producerChannelCreating = false;

              case 18:
                // Send the message
                content = JSON.stringify(data);
                options = {
                  persistent: true
                };
                producerChannel = this.producerChannel;

                if (producerChannel) {
                  _context3.next = 23;
                  break;
                }

                return _context3.abrupt("return", false);

              case 23:
                ok = producerChannel.sendToQueue(q, Buffer.from(content), options); // Wait for the broker to confirm the message was received

                if (!confirm) {
                  _context3.next = 32;
                  break;
                }

                _context3.next = 27;
                return producerChannel.waitForConfirms();

              case 27:
                _yield$producerChanne = _context3.sent;
                _yield$producerChanne2 = (0, _slicedToArray2["default"])(_yield$producerChanne, 1);
                confirmation = _yield$producerChanne2[0];

                if (!(confirmation !== undefined)) {
                  _context3.next = 32;
                  break;
                }

                return _context3.abrupt("return", false);

              case 32:
                return _context3.abrupt("return", ok);

              case 33:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function send(_x, _x2) {
        return _send.apply(this, arguments);
      }

      return send;
    }()
  }, {
    key: "registerWorker",
    value: function () {
      var _registerWorker = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(q, worker) {
        var prefetch,
            retryDelay,
            conn,
            retryQ,
            ch,
            _args5 = arguments;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                prefetch = _args5.length > 2 && _args5[2] !== undefined ? _args5[2] : 1;
                retryDelay = _args5.length > 3 && _args5[3] !== undefined ? _args5[3] : 60000;
                _context5.next = 4;
                return this.ensureConnection();

              case 4:
                conn = _context5.sent;
                // eslint-disable-next-line no-console
                console.log("\u2605\u2729\u2605 Registering worker on MQ: ".concat(q)); // Retry queue name

                retryQ = q + '-retry'; // Set up a channel for the worker

                _context5.next = 9;
                return conn.createChannel();

              case 9:
                ch = _context5.sent;
                _context5.next = 12;
                return ch.prefetch(prefetch);

              case 12:
                _context5.next = 14;
                return ch.assertQueue(q, {
                  durable: true,
                  deadLetterExchange: '',
                  deadLetterRoutingKey: retryQ
                });

              case 14:
                _context5.next = 16;
                return ch.assertQueue(retryQ, {
                  durable: true,
                  deadLetterExchange: '',
                  deadLetterRoutingKey: q,
                  messageTtl: retryDelay
                });

              case 16:
                return _context5.abrupt("return", ch.consume(q, /*#__PURE__*/function () {
                  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(msg) {
                    var content, data, result;
                    return _regenerator["default"].wrap(function _callee4$(_context4) {
                      while (1) {
                        switch (_context4.prev = _context4.next) {
                          case 0:
                            _context4.prev = 0;
                            content = msg.content.toString();
                            data = JSON.parse(content);
                            _context4.next = 5;
                            return worker(data, msg);

                          case 5:
                            result = _context4.sent;

                            if (!(result === true)) {
                              _context4.next = 9;
                              break;
                            }

                            _context4.next = 9;
                            return ch.ack(msg);

                          case 9:
                            if (!(result === false)) {
                              _context4.next = 12;
                              break;
                            }

                            _context4.next = 12;
                            return ch.nack(msg, false, false);

                          case 12:
                            if (!(typeof result === 'number')) {
                              _context4.next = 17;
                              break;
                            }

                            _context4.next = 15;
                            return new Promise(function (r) {
                              return setTimeout(r, result);
                            });

                          case 15:
                            _context4.next = 17;
                            return ch.nack(msg, false, false);

                          case 17:
                            _context4.next = 24;
                            break;

                          case 19:
                            _context4.prev = 19;
                            _context4.t0 = _context4["catch"](0);
                            // eslint-disable-next-line no-console
                            console.error('nack', q, _context4.t0);
                            _context4.next = 24;
                            return ch.nack(msg, false, false);

                          case 24:
                          case "end":
                            return _context4.stop();
                        }
                      }
                    }, _callee4, null, [[0, 19]]);
                  }));

                  return function (_x5) {
                    return _ref2.apply(this, arguments);
                  };
                }(), {
                  noAck: false
                }));

              case 17:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function registerWorker(_x3, _x4) {
        return _registerWorker.apply(this, arguments);
      }

      return registerWorker;
    }()
  }]);
  return AMQP;
}();

exports["default"] = AMQP;