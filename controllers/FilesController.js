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
            userId: req.user._id,
            name,
            type,
            parentId: parentId === 0 ? parentId : ObjectId(parentId),
            isPublic: isPublic || false,
        };

        if (type === 'folder') {
            newFolder = await dbClient.db.collection('files').insertOne(file);
            return res.status(201).send({
                id: newFolder._id.toString(),
                userId: newFolder.userId,
                name: newFolder.name,
                type: newFolder.type,
                parentId: newFolder.parentId,
                isPublic: newFolder.isPublic
            });
        } else {
            const PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
            const fs = require('fs');
            
            if (!fs.existsSync(PATH)) fs.mkdirSync(PATH, { recursive: true });
            const filePath = `${PATH}/${uuidv4()}`;
            const buff = Buffer.from(data, 'base64');
            
            /*await fs.writeFile(filePath, buff, (err) => {
                if (err) return res.status(500).send({ error: 'Cannot write data' });
            });*/
            
            newFile = await dbClient.db.collection('files').insertOne({ ...file, localPath: filePath });
            return res.status(201).send({
                userId: newFile.userId,
                name: newFile.name,
                type: newFile.type,
                isPublic: newFile.isPublic,
                parentId: newFile.parentId,
                localPath: newFile.localPath
            });
        }
    }

    static async getShow(req, res) {
        const token = req.header('X-Token');
        const user = redisClient.get(`auth_${token}`);
        if (!user) return res.status(401).send({ error: 'Unauthorized'});
    }
}

export default FilesController;