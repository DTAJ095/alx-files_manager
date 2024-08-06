// Redis utils
import redis from 'redis';
import { promisify } from 'util';


class RedisClient {
  constructor() {
    this.redisClient = redis.createClient();
    this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    this.redisClient.on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err.message}`);
    });
  }

  isAlive() {
    return this.redisClient.connected;
  }

  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  async set(key, value, duration) {
    this.redisClient.set(key, value);
    this.redisClient.expire(key, duration);
  }

  async del(key) {
    this.redisClient.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
