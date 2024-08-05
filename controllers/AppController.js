import redisClient from "../utils/redis";
import dbClient from "../utils/db";


class AppController {
    static getStatus(req, res) {
        try {
            const redis = redisClient.isAlive();
            const db = dbClient.isAlive();
            res.status(200).send({ redis, db });
        } catch (error) {
            console.log(error);
        }
    }
    
    static async getStats(req, res) {
        const users = await dbClient.nbUsers();
        const files = await dbClient.nbFiles();
        return res.status(200).send({ users, files });
    }
}

export default AppController;
