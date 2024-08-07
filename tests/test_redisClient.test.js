import { expect } from 'chai';
import chaiHttp from 'chai-http';
import redisClient from '../utils/redis';

chai.use(chaiHttp);

describe('Testing Redis client', function() {
  it('Testing isAlive() function', function() {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('Testing get() function', async function() {
    const value = await redisClient.get('myKey');
    expect(value).to.equal(null);
  });

  it('Testing set() function', async function() {
    const value = await redisClient.set('myKey', 'myValue', 5);
    expect(value).to.equal(undefined);
  });

  it('Testing get() function', async function() {
    const value = await redisClient.get('myKey');
    expect(value).to.equal('myValue');
  });

  it('Testing del() function', async function() {
    const value = await redisClient.del('myKey');
    expect(value).to.equal(undefined);
  });
  
  it('Returns null for a non-existing key', async function() {
    const value = await redisClient.get('nonExistingKey');
    expect(value).to.equal(null);
  });
  
  it('Returns key with null value after expiration', async function() {
    await redisClient.set('key', 'value', 1);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const value = await redisClient.get('key');
    expect(value).to.equal(null);
  });
});
