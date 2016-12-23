import assert from 'assert';
import AMQP from './amqp';

export default class Queue {
  constructor(amqp, queue, prefetch = 1, worker = null) {
    assert(amqp instanceof AMQP, 'error');

    // Make prefetch optional
    if (typeof prefetch === 'function') {
      worker = prefetch;
      prefetch = 1;
    }

    this.queue = queue;
    this.worker = worker;
    this.AMQP = amqp;
    if (worker) {
      this.done = this.registerWorker(queue, worker, prefetch || 1);
    }
  }

  ready() {
    return this.done;
  }

  send(message, confirm = true) {
    return this.AMQP.send(this.queue, message, confirm);
  }

  async registerWorker(q, worker, prefetch) {

    // Connect to RabbitMQ
    if (! this.AMQP.connection) {
      await this.AMQP.connect();
    }

    // eslint-disable-next-line no-console
    console.log(`-> Registering worker on MQ: ${q}`);

    let retryQ = q + '-retry';
    let delay = 1000 * 60;

    // Set up a channel for the worker
    let ch = await this.AMQP.connection.createChannel();
    await ch.prefetch(prefetch);

    // The main queue
    await ch.assertQueue(q, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: retryQ
    });

    // The retry queue - nacked jobs will go here, once the TTL expires they go
    // back into the main queue.
    await ch.assertQueue(retryQ, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: q,
      messageTtl: delay
    });

    // Attach the worker
    return ch.consume(q, async function (msg) {
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
        console.error('nack', q, e);
        await ch.nack(msg, false, false);
      }
    }, {noAck: false});
  }
}
