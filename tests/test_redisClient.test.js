import { expect } from 'chai';
import chaiHttp from 'chai-http';
import redisClient from '../utils/redis';

use(chaiHttp);

describe('testing Redis client', () => {
  it('testing isAlive() function', () => {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('testing get() function', async () => {
    const value = await redisClient.get('myKey');
    expect(value).to.equal(null);
  });

  it('testing set() function', async () => {
    const value = await redisClient.set('myKey', 'myValue', 5);
    expect(value).to.equal(undefined);
  });

  it('testing get() function', async () => {
    const value = await redisClient.get('myKey');
    expect(value).to.equal('myValue');
  });

  it('testing del() function', async () => {
    const value = await redisClient.del('myKey');
    expect(value).to.equal(undefined);
  });

  it('returns null for a non-existing key', async () => {
    const value = await redisClient.get('nonExistingKey');
    expect(value).to.equal(null);
  });

  it('returns key with null value after expiration', async () => {
    await redisClient.set('key', 'value', 1);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const value = await redisClient.get('key');
    expect(value).to.equal(null);
  });
});
