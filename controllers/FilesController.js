import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import Queue from 'bull';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const fileQueue = new Queue('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const user = redisClient.get(`auth_${token}`);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const {
      name, type, parentId, isPublic, data,
    } = req.body;
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
      parentId: parentId === 0 ? parentId : ObjectId(parentId),
      isPublic: isPublic || false,
    };

    if (type === 'folder') {
      try {
        const newFile = await dbClient.db.collection('files').insertOne(file);
        file.id = newFile.insertedId;
      } catch (err) {
        console.log(err);
      }
      return res.status(201).send({
        id: file.id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    }

    if (type === 'image') {
        await fileQueue.add({ userId: file.userId, fileId: file.id });
    }

    const PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(PATH)) {
      fs.mkdirSync(PATH, { recursive: true });
    }

    const fileUUID = uuidv4();
    const localPath = path.join(PATH, fileUUID);
    const buff = Buffer.from(data, 'base64');
    try {
      fs.writeFile(localPath, buff);
    } catch (err) {
      return res.status(500).send({ error: 'Cannot write in file' });
    }
    file.localPath = localPath;
    const newFile = await dbClient.db.collection('files').insertOne(file, localPath);
    return res.status(201).send({
      id: newFile.insertedId,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.header('X-Token');
    const user = await redisClient.get(`auth_${token}`);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { id } = req.params.id || 0;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid ID' });
    }

    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(user) });
    if (!file) return res.status(404).send({ error: 'Not found' });
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
    const token = req.header('X-Token');
    const user = await redisClient.get(`auth_${token}`);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { parentId = 0, page = 0 } = req.query;
    const folder = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId), userId: ObjectId(user) });
    if (!folder) return res.status(200).send([]);
    const pageSize = 20;
    const next = page * pageSize;

    const files = await dbClient.db.collection('files').aggregate([
      { $match: { parentId: parentId === '0' ? 0 : ObjectId(parentId), userId: ObjectId(user) } },
      { $skip: next },
      { $limit: pageSize },
    ]).toArray();
    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
    const token = req.header('X-Token');
    const user = await redisClient.get(`auth_${token}`);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { id } = req.params.id || 0;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid ID' });
    }

    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(user) });
    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });
    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    const user = await redisClient.get(`auth_${token}`);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { id } = req.params.id || 0;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid ID' });
    }

    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(user) });
    if (!file) return res.status(404).send({ error: 'Not found' });

    await dbClient.db.collection('files').updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });
    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
    try {
      const token = req.header('X-Token');
      const user = await redisClient.get(`auth_${token}`);
      if (!user) return res.status(401).send({ error: 'Unauthorized' });

      const { id } = req.params.id || 0;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: 'Invalid ID' });
      }

      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(user) });
      if (!file) return res.status(404).send({ error: 'Not found' });
      if (file.isPublic === false && !user) return res.status(404).send({ error: 'Not found' });

      if (file.type === 'folder') return res.status(400).send({ error: "A folder doesn't have content" });

      const { localPath } = file;
      if (!fs.existsSync(localPath)) return res.status(404).send({ error: 'Not found' });

      const mimeType = mime.getType(file.name);
      const data = fs.readFileSync(localPath);
      res.setHeader('Content-Type', mimeType);
      return res.status(200).send(data);
    } catch (err) {
      return res.status(500).send({ error: 'Server error' });
    }
  }
}

export default FilesController;
