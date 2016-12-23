import assert from 'assert';
import AMQP from './amqp';

export default class Queue {
  constructor(amqp, queue, options = {}, worker = null) {
    assert(amqp instanceof AMQP);
    assert(typeof queue === 'string');

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

  async registerWorker(options = {}, worker) {
    // Make options optional
    if (typeof options === 'function') {
      worker = options;
      options = {};
    }

    assert(typeof worker === 'function');
    assert(typeof options === 'object');
    let {prefetch, retryDelay} = options;

    // Default prefetch (eg. concurrency)
    prefetch = prefetch || 1;

    // Default time before retrying nacked messages
    retryDelay = retryDelay || 1000 * 60;

    // Connect to RabbitMQ
    await this.AMQP.connect();

    // eslint-disable-next-line no-console
    console.log(`-> Registering worker on MQ: ${this.queue}`);

    let retryQ = this.queue + '-retry';

    // Set up a channel for the worker
    let ch = await this.AMQP.connection.createChannel();
    await ch.prefetch(prefetch);

    // The main queue
    await ch.assertQueue(this.queue, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: retryQ
    });

    // The retry queue - nacked jobs will go here, once the TTL expires they go
    // back into the main queue.
    await ch.assertQueue(retryQ, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: this.queue,
      messageTtl: retryDelay
    });

    // Attach the worker
    return ch.consume(this.queue, async function (msg) {
      try {
        let content = msg.content.toString();
        let data = JSON.parse(content);
        let result = await worker(data);

        // Remove the message from the queue
        if (result === true) {
          await ch.ack(msg);
        }

        // Move the message to the retry queue
        if (result === false) {
          await ch.nack(msg, false, false);
        }

        // Move the message to the retry queue after a provided delay.
        // Keeping a message unacked for some time can be used to temporarily
        // preventing the consumer from prefetching a new message, effectively
        // slowing down or block the queue. Ex. for handling rate limits.
        if (typeof result === 'number') {
          await new Promise(r => setTimeout(r, result));
          await ch.nack(msg, false, false);
        }

      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('nack', this.queue, e);
        await ch.nack(msg, false, false);
      }
    }, {noAck: false});
  }
}
