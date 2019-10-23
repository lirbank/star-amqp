import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import AMQP from '../src/index';

chai.use(chaiAsPromised);
const connectionString = process.env.URI;

describe('AMQP constructor', function() {
  describe('with url option', function() {
    it('should return an instance of AMQP', function() {
      const client = new AMQP({ url: connectionString });
      assert.instanceOf(client, AMQP);
    });
  });

  describe('with url and certificate options', function() {
    it('should return an instance of AMQP', function() {
      const client = new AMQP({ url: connectionString, certificate: 'cert' });
      assert.instanceOf(client, AMQP);
    });
  });

  describe('with no url property in options', function() {
    it('should throw', function() {
      try {
        new AMQP({});
        assert.fail();
      } catch (e) {
        assert.equal(e.message, "The 'options.url' param is required");
      }
    });
  });

  describe('with no options', function() {
    it('should throw', function() {
      try {
        new AMQP();
        assert.fail();
      } catch (e) {
        assert.equal(e.message, "The 'options.url' param is required");
      }
    });
  });
});
