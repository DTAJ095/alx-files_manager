import userUtils from "../utils/user";
import dbClient from "../utils/db";
import { ObjectId } from 'mongodb';
import queue from 'bull';
import { v4 as uuid4 } from 'uuid';
import mime from 'mime-types';

const fileQueue = new queue('fileQueue');
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const VALID_TYPES = ['folder', 'file', 'image', 'video'];


/**
 * Files controller
 */
class FilesController {
    /**
     * Create a new file
     * @param {string} req 
     * @param {string} res 
     * @returns 
     */
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

    /**
     * Get a file
     * @returns file
     */
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

    /**
     * Get all files
     * @returns 
     */
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

    /**
     * set file parameter isPublic to true
     * @returns 
     */
    static async putPublish(req, res) {
        const { userId } = await userUtils.getUserIdAndKey(req);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });

        const fileId = req.params.id;
        const file = await dbClient.files.findOne({ _id: ObjectId(fileId) });
        if (!file) return res.status(404).send({ error: 'Not found' });
        if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });

        await dbClient.files.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: true } });
        return res.status(200).send({ id: file._id, userId: file.userId, name: file.name, type: file.type, isPublic: true, parentId: file.parentId });
    }

    /**
     * set file parameter isPublic to false
     */
    static async putUnpublish(req, res) {
        const { userId } = await userUtils.getUserIdAndKey(req);
        if (!userId) return res.status(401).send({ error: 'Unauthorized' });

        const fileId = req.params.id;
        const file = await dbClient.files.findOne({ _id: ObjectId(fileId) });
        if (!file) return res.status(404).send({ error: 'Not found' });
        if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });

        await dbClient.files.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: false } });
        return res.status(200).send({ id: file._id, userId: file.userId, name: file.name, type: file.type, isPublic: false, parentId: file.parentId });
    }

    static async getFile(req, res) {
        const size = req.query.size || null;

        const { userId } = await userUtils.getUserIdAndKey(req);
        const id = req.params.id || null;
        const file = await dbClient.files.findOne({ _id: ObjectId(id) });
        if (!file) return res.status(404).send({ error: 'Not found' });
        if (file.isPublic === false && file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });
        if (file.type === 'folder') return res.status(400).send({ error: 'A folder doesn\'t have content' });
        if (!file.localPath) return res.status(404).send({ error: 'Not found'});

        const path = size === 0 ? file.localPath : `${file.localPath}_${size}`;

        try {
            const fileData = readFileSync(path);
            const mimeType = mime.contentType(file.name);
            res.setHeader('Content-Type', mimeType);
            return res.status(200).send(fileData);
        } catch (error) {
            return res.status(404).send({ error: 'Not found' });
        }
    }
}

export default FilesController;
