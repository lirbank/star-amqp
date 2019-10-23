/* eslint-disable no-console */
import 'source-map-support/register';

if (!process.env.URI) {
  console.log('Usage:');
  console.log("URI='amqp://username:password@host/vhost' npm test\n");
  process.exit(1);
}

require('./amqp.js');
require('./queue.js');
