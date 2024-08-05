import dbClient from "../utils/db";
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import userUtils from '../utils/user';
import queue from 'bull';

const userQueue = new queue('userQueue');


class UsersController {
    static async postNew(req, res) {
        const { email, password } = req.body;
        if (!email) return res.status(400).send({ error: 'Missing email' });
        if (!password) return res.status(400).send({ error: 'Missing password' });
        
        userEmail = await dbClient.userCollection.findOne({ email });
        if (userEmail) return res.status(400).send({ error: 'Already exist' });

        const sha1Password = sha1(password);
        let user; 
        try {
            user = await dbClient.userCollection.insertOne({ email, password: sha1Password });
        } catch (error) {
            return res.status(500).send({ error: 'Error creating user' });
        }

        const newUser = {
            id: user.insertedId,
            email,
        };
        await userQueue.add({ userId: newUser.id.toString() });
        return res.status(201).send(newUser);
    }

    static async getMe(req, res) {
        const { userId } = await userUtils.getUserIdAndKey(req);
        const user = await userUtils.findUser({ _id: ObjectId(userId) });
        if (!user) return res.status(401).send({ error: 'Unauthorized' });
        delete user.password;
        return res.status(200).send(user);
    }
}

export default UsersController;
