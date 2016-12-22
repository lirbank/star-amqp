import fs from 'fs';
import amqp from 'amqplib';

export const Settings = {
  'url': '',
  'certificatePath': ''
};

let conn;
let connecting = false;

let producerChannel;
let producerChannelCreating = false;

const AMQP = {
  connect: async function () {

    // Wait for an initated connection process
    if (connecting || ! Settings.url) {
      await new Promise(r => setTimeout(r, 500));
      await this.connect();
      return;
    }
    if (conn) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log('-> Connecting to RabbitMQ');
    connecting = true;

    let options = {};
    if (Settings.certificatePath) {
      options = {ca: [fs.readFileSync(Settings.certificatePath)]};
    }
    conn = await amqp.connect(Settings.url, options);

    // eslint-disable-next-line no-console
    console.log('-> Connected to RabbitMQ');
    connecting = false;
  },

  close: async function () {
    // eslint-disable-next-line no-console
    console.log('-> Disconnecting from RabbitMQ');
    if (conn) {
      await conn.close();
    }
  },

  send: async function (q, data, confirm = true) {

    // Connect to RabbitMQ
    if (! conn) {
      await this.connect();
    }

    // Wait for the producerChannel to be set up
    if (producerChannelCreating) {
      await new Promise(r => setTimeout(r, 250));
      return await this.send(q, data, confirm);
    }

    // Set up a channel
    if (! producerChannel) {
      // eslint-disable-next-line no-console
      console.log('-> Creating RabbitMQ Producer Channel');
      producerChannelCreating = true;
      // NOTE: It's important to use createConfirmChannel() and not
      // createChannel() here, or else sendToQueue() will not have a callback,
      // and we won't be able to create a promise to know if the server has
      // accepted the message (which has caused problems before).
      producerChannel = await conn.createConfirmChannel();

      // eslint-disable-next-line no-console
      console.log('-> Created RabbitMQ Producer Channel');
      producerChannelCreating = false;
    }

    // Send the message
    let content = JSON.stringify(data);
    let options = { persistent: true };
    let ok = producerChannel.sendToQueue(q, Buffer.from(content), options);

    // Wait for the broker to confirm the message was received
    if (confirm) {
      let confirmations = await this.waitForConfirms();

      // The confirmation is 'undefined' if all is well
      if (confirmations[0] !== undefined) {
        return false;
      }
    }
    return ok;
  },

  waitForConfirms: async function () {
    return await producerChannel.waitForConfirms();
  },
};


export class Queue {
  constructor(queue, options, worker = null) {
    const {prefetch} = options;
    this.queue = queue;
    this.worker = worker;
    this.done = this.registerWorker(queue, worker, prefetch || 1);
  }

  ready() {
    return this.done;
  }

  send(message, confirm = true) {
    return AMQP.send(this.queue, message, confirm);
  }

  async registerWorker(q, worker, prefetch) {

    // Connect to RabbitMQ
    if (! conn) {
      await AMQP.connect();
    }

    // eslint-disable-next-line no-console
    console.log(`-> Registering worker on MQ: ${q}`);

    let retryQ = q + '-retry';
    let delay = 1000 * 60;

    // Set up a channel for the worker
    let ch = await conn.createChannel();
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

// export default {send, waitForConfirms, registerWorker, close};
export default AMQP;
