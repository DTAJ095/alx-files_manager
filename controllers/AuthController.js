import redisClient from "../utils/redis";
import userUtils from "../utils/user";
import dbClient from "../utils/db";
import sha1 from "sha1";
import { v4 as uuidv4 } from "uuid";


class AuthController {
    static async getConnect(req, res) {
        const auth = req.header("Authorization");
        if (!auth) return res.status(401).send({ error: "Unauthorized" });

        const buffer = Buffer.from(auth.replace("Basic ", ""), "base64");
        const credentials = buffer.toString("utf-8");
        const [email, password] = credentials.split(":");

        if (!email || !password) return res.status(401).send({ error: "Unauthorized" });

        const user = await dbClient.userCollection.findOne({ email, password: sha1(password) });
        if (!user) return res.status(401).send({ error: "Unauthorized" });

        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 86400);
        return res.status(200).send({ token });
    }

    static async getDisconnect(req, res) {
        const token = await userUtils.getToken(req);
        if (!token) return res.status(401).send({ error: "Unauthorized" });

        await redisClient.del(`auth_${token}`);
        return res.status(204).end();
    }
}

export default AuthController;