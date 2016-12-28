// @flow
import fs from 'fs';
import amqp from 'amqplib';
import Queue from './queue';

export default class AMQP {
  url: string
  certificatePath: string
  connectionString: string
  connecting: boolean
  connection: ?{
    close: Function,
    createConfirmChannel: Function,
    createChannel: Function
  }
  producerChannel: ?{waitForConfirms: Function, sendToQueue: Function}
  producerChannelCreating: boolean

  constructor({url, certificatePath}: {url: string, certificatePath: string}) {
    this.url = url;
    this.certificatePath = certificatePath;
    this.connecting = false;
    this.connection;
    this.producerChannelCreating = false;
    this.producerChannel;
  }

  get Queue(): Queue {
    return Queue.bind(null, this);
  }

  async ensureConnection() {

    // Wait for an initated connection process
    if (this.connecting || ! this.url) {
      await new Promise(r => setTimeout(r, 500));
      return await this.ensureConnection();
    }
    if (this.connection) {
      return this.connection;
    }

    // eslint-disable-next-line no-console
    console.log('-> Connecting to RabbitMQ');
    this.connecting = true;

    let options = {};
    if (this.certificatePath) {
      options = {ca: [fs.readFileSync(this.certificatePath)]};
    }
    const conn = await amqp.connect(this.url, options);

    // eslint-disable-next-line no-console
    console.log('-> Connected to RabbitMQ');
    this.connection = conn;
    this.connecting = false;
    return conn;
  }

  async close() {
    // eslint-disable-next-line no-console
    console.log('-> Disconnecting from RabbitMQ');
    if (this.connection) {
      await this.connection.close();
    }
  }

  async send(q: string, data: {}, confirm: boolean = true) {

    // Connect to RabbitMQ
    const conn = await this.ensureConnection();

    // Wait for the producerChannel to be set up
    if (this.producerChannelCreating) {
      await new Promise(r => setTimeout(r, 250));
      return await this.send(q, data, confirm);
    }

    // Set up a channel
    if (! this.producerChannel) {
      // eslint-disable-next-line no-console
      console.log('-> Creating RabbitMQ Producer Channel');
      this.producerChannelCreating = true;
      // NOTE: It's important to use createConfirmChannel() and not
      // createChannel() here, or else sendToQueue() will not have a callback,
      // and we won't be able to create a promise to know if the server has
      // accepted the message (which has caused problems before).
      this.producerChannel = await conn.createConfirmChannel();

      // eslint-disable-next-line no-console
      console.log('-> Created RabbitMQ Producer Channel');
      this.producerChannelCreating = false;
    }

    // Send the message
    const content = JSON.stringify(data);
    const options = {persistent: true};
    const {producerChannel} = this;

    if (! producerChannel) {
      return false;
    }

    const ok = producerChannel.sendToQueue(q,
      Buffer.from(content), options);

    // Wait for the broker to confirm the message was received
    if (confirm) {
      const [confirmation] = await producerChannel.waitForConfirms();

      // The confirmation is 'undefined' if all is well
      if (confirmation !== undefined) {
        return false;
      }
    }
    return ok;
  }

  async registerWorker(
    q: string,
    worker: Function,
    prefetch: number = 1,
    retryDelay: number = 60000
  ) {

    // Connect to RabbitMQ
    const conn = await this.ensureConnection();

    // eslint-disable-next-line no-console
    console.log(`-> Registering worker on MQ: ${q}`);

    // Retry queue name
    let retryQ = q + '-retry';

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
      messageTtl: retryDelay
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
