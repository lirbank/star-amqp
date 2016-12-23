export default class Queue {
  constructor(amqp, queue, options = {}, worker = null) {
    this.queue = queue;
    this.AMQP = amqp;
    if (worker) {
      this.done = this.registerWorker(options, worker);
    }
  }

  ready() {
    return this.done;
  }

  send(message, confirm = true) {
    return this.AMQP.send(this.queue, message, confirm);
  }

  async registerWorker(options, worker) {
    // Make options optional
    if (typeof options === 'function') {
      worker = options;
      options = {};
    }
    const {prefetch, retryDelay} = options;
    await this.AMQP.registerWorker(this.queue, worker, prefetch, retryDelay);
  }
}
