import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');
    if (!auth) return res.status(401).send({ error: 'Unauthorized' });

    const buff = Buffer.from(auth.replace('Basic ', ''), 'base64');
    const credentials = { email: buff.toString('utf-8').split(':')[0], password: buff.toString('utf-8').split(':')[1] };

    if (!credentials.email || !credentials.password) return res.status(401).send({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ email: credentials.email, password: sha1(credentials.password) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    const value = user._id.toString();
    const duration = 60 * 60 * 24;
    await redisClient.set(key, value, duration);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const value = await redisClient.get(`auth_${token}`);
    if (!value) return res.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);
    return res.status(204).end();
  }
}

export default AuthController;
