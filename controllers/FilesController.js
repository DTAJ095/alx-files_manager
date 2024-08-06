import dbClient from "../utils/db";
import redisClient from "../utils/redis";
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

class FilesController{
    static async postUpload(req, res){
        const token = req.header('X-Token');
        const user = redisClient.get(`auth_${token}`);
        if (!user) return res.status(401).send({ error: 'Unauthorized' });

        const { name, type, parentId, isPublic, data } = req.body;
        if (!name) return res.status(400).send({ error: 'Missing name' });
        if (!type) return res.status(400).send({ error: 'Missing type' });
        if (!data && type !== 'folder') return res.status(400).send({ error: 'Missing data' });

        if (parentId) {
            const parent = dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
            if (!parent) return res.status(400).send({ error: 'Parent not found' });
            if (parent.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
        }

        const file = {
            userId: user._id,
            name,
            type,
            parentId,
            isPublic: isPublic || false,
            data
        };

        if (type === 'folder') {
            await dbClient.db.collection('files').insertOne(file);
            return res.status(201).send(file);
        }

        const PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fs = require('fs');

        if (!fs.existsSync(PATH)) fs.mkdirSync(PATH, { recursive: true });
        const filePath = `${PATH}/${uuidv4()}`;
        const buff = Buffer.from(data, 'base64');

        await fs.writeFile(filePath, buff, (err) => {
            if (err) return res.status(500).send({ error: 'Cannot write data' });
        });

        await dbClient.db.collection('files').insertOne({ ...file, localPath: filePath });
        return res.status(201).send(file);
    }
}