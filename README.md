# Star AMQP

## Installation

```sh
npm install --save star-amqp
```

## Usage

### Client

```js
const client = new AMQP({
  url: 'connectionString',
  certificate: 'certificateString',
});
```

### Producer

```js
const myQueue = new client.Queue('test');
myQueue.send({ some: 'stuff' });
```

### Consumers (eg. workers)

```js
const myQueue = new client.Queue('test', (data, info) => {
  // `data` is the message payload
  // `info` holds all info about the MQ message (retry count, etc)
  console.log(JSON.stringify(data));
  return true;
});
myQueue.send({ some: 'stuff' });
```

### Creating queues and attaching workers

The following code will create a queue called 'test-queue', and a retry queue
called 'test-queue-retry'. The attached worker will process 1 message at the
time. If a message is Nacked (eg. failed) by the worker it will be retried again
in 60 seconds. Once a message is Acked (successfully processed) by the worker it
is removed from the queue.

```js
// Instantiate the client
const client = new AMQP({ url: 'amqp://your-rabbitmq-connection-string' });

// Queue options
const opts = { retryDelay: 60000, prefetch: 100 };

// Instantiate a queue and attach a worker
const testQueue = new client.Queue('test-queue', async message => {
  // Print the payload
  console.log('processing ->', JSON.stringify(message));

  // Ack
  return true;

  // Nack - the message will be retried in 60 seconds
  // return false

  // Nack with a delay - for handling rate limits
  // return 1000
});

// Sending some messages to the queue. The message can be any JSONifyable type.
testQueue.send({ some: 'payload' });
testQueue.send({ another: 'payload' });
testQueue.send('string as a payload');
testQueue.send(['an', 'array']);
testQueue.send(1);
```

### Options

You can provide an object literal with options to the `Queue` constructor to
modify the default behavior of a queue.

With the options below the attached worker will process up to 100 messages
simultaneously and any failed messages will be retried in 30 seconds.

```js
const opts = {
  // Concurrency, max number of simultaneously processed messages (default: 1)
  prefetch: 100,

  // The delay in milliseconds before Nacked messages are retried (default: 60000)
  retryDelay: 30000,
};

# Instantiate the queue and attach the worker with the new options.
new client.Queue('test-queue', opts, async message => true);
```

### Batch send messages

TBD

### Retry queues

TBD

## Contributing

Contributions are encouraged.

Before issuing a pull request, please run the following checks.

```sh
npm run lint
npm run flow
URI='amqp://username:password@host/vhost' npm run test
```

If you need a RabbitMQ server to test against,
[CloudAMQP](https://www.cloudamqp.com/) offers free RabbitMQ vhosts.

## Changelog

v0.0.6 - Message details are passed to worker
([#1](https://github.com/lirbank/star-amqp/pull/1)) Thanks
[@cyrillegin](https://github.com/cyrillegin)

v0.0.7 - Upgrade amqplib dependency to v0.5.3
([#5](https://github.com/lirbank/star-amqp/pull/5))

v0.0.8 - Updated babel versions and config ([#18](https://github.com/lirbank/star-amqp/pull/18))