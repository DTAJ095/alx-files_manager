import redisClient from "../utils/redis";
import dbClient from "../utils/db";


class AppController {
    static getStatus(req, res) {
        if (redisClient.isAlive() && dbClient.isAlive()) {
        return res.status(200).send({ redis: true, db: true });
        }
    }
    
    static async getStats(req, res) {
        const users = await dbClient.nbUsers();
        const files = await dbClient.nbFiles();
        return res.status(200).send({ users, files });
    }
}

export default AppController;
