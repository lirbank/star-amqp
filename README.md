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
  certificate: 'certificateString'
});
```

### Producer
```js
const myQueue = new client.Queue('test');
myQueue.send({some: 'stuff'});
```

### Consumers (eg. workers)
```js
const myQueue = new client.Queue('test', message => {
  console.log(JSON.stringify(message));
  return true;
});
myQueue.send({some: 'stuff'});
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

If you need a RabbitMQ server to test against, [CloudAMQP](https://www.cloudamqp.com/) offers free RabbitMQ vhosts.
