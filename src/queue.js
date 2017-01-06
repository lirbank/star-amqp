// @flow
import assert from 'assert';

export default class Queue {
  queue: string;
  AMQP: {send: Function, registerWorker: Function};
  done: Promise<*>; // TODO: annotate type explicitly
  static bind: Function

  constructor(
    amqp: {send: Function, registerWorker: Function},
    queue: string,
    options: {prefetch: ?number, retryDelay: ?number} | Function,
    worker: ?Function
  ) {

    assert(typeof queue === 'string', 'The \'queue\' param is required');

    this.queue = queue;
    this.AMQP = amqp;
    if (worker) {
      this.done = this.registerWorker(options, worker);
    }
  }

  ready() {
    return this.done;
  }

  send(message: {}, confirm: boolean = true) {
    return this.AMQP.send(this.queue, message, confirm);
  }

  async registerWorker(
    options: {prefetch: ?number, retryDelay: ?number} | Function,
    worker: ?Function
  ) {

    // Make options optional
    if (typeof options === 'function') {
      worker = options;
      options = {
        prefetch: 1,
        retryDelay: 60000
      };
    }
    const {prefetch, retryDelay} = options;
    await this.AMQP.registerWorker(this.queue, worker, prefetch, retryDelay);
  }
}
