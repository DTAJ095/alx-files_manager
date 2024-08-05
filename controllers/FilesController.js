import userUtils from "../utils/user";
import dbClient from "../utils/db";
import { ObjectId } from 'mongodb';
import queue from 'bull';
import { v4 as uuid4 } from 'uuid';

const fileQueue = new queue('fileQueue');
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const VALID_TYPES = ['folder', 'file', 'image', 'video'];


class FilesController {
    static async postUpload(req, res) {
        const { userId } = await userUtils.getUserIdAndKey(req);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });

        const fileParams = {
            name: req.body ? req.body.name : null,
            type: req.body ? req.body.type : null,
            parentId: req.body && req.body.parentId ? req.body.parentId : '0',
            isPublic: req.body && req.body.isPublic ? req.body.isPublic : false,
            data: req.body && req.body.data ? req.body.data : null,
        };

        if (!fileParams.name) return res.status(400).send({ error: 'Missing name' });
        if (!fileParams.type || !VALID_TYPES.includes(fileParams.type)) return res.status(400).send({ error: 'Missing type' });
        if (!fileParams.data && !['folder'].includes(fileParams.type)) return res.status(400).send({ error: 'Missing data' });

        parent = await dbClient.files.find_one({ _id: ObjectId(fileParams.parentId) });
        if (!parent) return res.status(400).send({ error: 'Parent not found' });
        if (parent.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });

        if (fileParams.type === 'folder') {
            const newFile = await dbClient.files.insert_one({
                userId: ObjectId(userId),
                name: fileParams.name,
                type: fileParams.type,
                parentId: fileParams.parentId === '0' ? '0' : ObjectId(fileParams.parentId),
                isPublic: fileParams.isPublic,
            });
            return res.status(201).send(newFile);
        }

        const path = `${FOLDER_PATH}/${uuid4()}`;
        const buff = Buffer.from(fileParams.data, 'base64');
        await fs.promises.writeFile(path, buff.toString(), { flag: 'w' });
        
        const insertedFile = await dbClient.files.insert_one({
            userId: ObjectId(userId),
            name: fileParams.name,
            type: fileParams.type,
            parentId: fileParams.parentId === '0' ? '0' : ObjectId(fileParams.parentId),
            isPublic: fileParams.isPublic,
            localPath: path,
        });

        if (fileParams.type === 'file') {
            await fileQueue.add({ fileId: insertedFile.insertedId.toString(), localPath: path, userId: userId });
        }
        if (fileParams.type === 'image') {
            await fs.promises.writeFile(path, buff.toString('base64'), { flag: 'w', encoding: 'binary' });
            await fileQueue.add({ fileId: insertedFile.insertedId.toString(), localPath: path, userId: userId });
        }
        return res.status(201).send(insertedFile);

    }

    static async getShow(req, res) {
        const { userId } = await userUtils.getUserIdAndKey(req);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });

        const fileId = req.params.id;
        const file = await dbClient.files.findOne({ _id: ObjectId(fileId) });
        if (!file) return res.status(404).send({ error: 'Not found' });
        if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });
        return res.status(200).send({
            id: file._id,
            userId: file.userId,
            name: file.name,
            type: file.type,
            isPublic: file.isPublic,
            parentId: file.parentId,
        });
    }

    static async getIndex(req, res) {
        const { userId } = await userUtils.getUserIdAndKey(req);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });

        const parentId = req.query.parentId || '0';
        const pagination = req.query.page || 0;
        const aggregationMatch = { $and: [{ parentId }] };
        let aggregateData = [
            { $match: aggregationMatch },
            { $skip: pagination * 20 },
            { $limit: 20 },
        ];
        if (parentId === '0') {
            aggregateData = [
                { $match: { $and: [{ parentId }, { userId: ObjectId(userId) }] } },
                { $skip: pagination * 20 },
                { $limit: 20 },
            ];
        }
        const files = await dbClient.files.aggregate(aggregateData).toArray();
        const filesArray = [];
        await files.array.forEach(item => {
            const fileItems = {
                id: item._id,
                userId: item.userId,
                name: item.name,
                type: item.type,
                isPublic: item.isPublic,
                parentId: item.parentId,
            };
            filesArray.push(fileItems);
        });
        return res.status(200).send(filesArray);
    }
}

export default FilesController;
