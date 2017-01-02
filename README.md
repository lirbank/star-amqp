# Star AMQP

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
