import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import AMQP from '../src/index';
import Queue from '../src/queue';

chai.use(chaiAsPromised);
const connectionString = process.env.URI;

describe('Queue constructor', function () {
  const client = new AMQP({url: connectionString});

  describe('with queue parameter', function () {
    it('should return an instance of Queue', function () {
      let options;
      let queue;

      queue = new client.Queue('test-queue');
      assert.instanceOf(queue, Queue);

      queue = new client.Queue('test-queue', () => true);
      assert.instanceOf(queue, Queue);

      options = {};
      queue = new client.Queue('test-queue', options, () => true);
      assert.instanceOf(queue, Queue);

      options = {prefetch: 10};
      queue = new client.Queue('test-queue', options, () => true);
      assert.instanceOf(queue, Queue);

      options = {retryDelay: 60000};
      queue = new client.Queue('test-queue', options, () => true);
      assert.instanceOf(queue, Queue);

      options = {prefetch: 10, retryDelay: 60000};
      queue = new client.Queue('test-queue', options, () => true);
      assert.instanceOf(queue, Queue);
    });
  });

  describe('with no parameters', function () {
    it('should throw', function () {
      try {
        new client.Queue();
        assert.fail();
      } catch (e) {
        assert.equal(e.message, 'The \'queue\' param is required');
      }
    });
  });
});

describe('#send()', function () {
  const client = new AMQP({url: connectionString});
  const queue = new client.Queue('test');

  it('should return true or false', function () {
    const ok = queue.send({'x': 1});
    assert.eventually.isBoolean(ok);
  });

  it('should return true or false', function () {
    const ok = queue.send({'x': 1}, true);
    assert.eventually.isBoolean(ok);
  });

  it('should return true or false', function () {
    const ok = queue.send({'x': 1}, false);
    assert.eventually.isBoolean(ok);
  });
});
