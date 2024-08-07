/*import dbClient from "../utils/db";
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
            
            await fs.writeFile(filePath, buff, (err) => {
                if (err) return res.status(500).send({ error: 'Cannot write data' });
            });
            
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

export default FilesController;*/
import { v4 as uuidv4 } from 'uuid';
import Queue from 'bull/lib/queue';
import fileService from '../utils/fileService';
import dbClient from '../utils/db';


const VALID_FILE_TYPES = { folder: 'folder', file: 'file', image: 'image' };

const fileQueue = new Queue('thumbnail generation');

/**
 * Controller for the index route.
 * @class FilesController
 * @method postUpload
 */
class FilesController {
  /**
   * Method for the route POST /files.
   * Create's a new file in DB and in disk.
   * @param {object} _req - The express request object.
   * @param {object} res - The express response object.
   * @returns {object}
   */
  static async postUpload(req, res) {
    const name = req.body ? req.body.name : null;
    const type = req.body ? req.body.type : null;
    const parentId = req.body && req.body.parentId ? req.body.parentId : 0;
    const isPublic = req.body && req.body.isPublic ? req.body.isPublic : false;
    const data = req.body && req.body.data ? req.body.data : '';

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !VALID_FILE_TYPES[type]) return res.status(400).json({ error: 'Missing type' });
    if (type !== VALID_FILE_TYPES.folder && !data) return res.status(400).json({ error: 'Missing data' });

    if (parentId) {
      const parentFile = await dbClient.getFileById(parentId);
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== VALID_FILE_TYPES.folder) return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileData = {
      userId: req.user._id,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    };

    if (type === VALID_FILE_TYPES.folder) {
      const newFolder = await fileService.saveFileInDB(fileData, dbClient);
      return res.status(201).json({
        id: newFolder._id.toString(),
        userId: newFolder.userId,
        name: newFolder.name,
        type: newFolder.type,
        isPublic: newFolder.isPublic,
        parentId: newFolder.parentId,
      });
    }
    const filename = uuidv4();
    const localPath = await fileService.saveFileInDisk(data, filename);
    fileData.localPath = localPath;
    const newFile = await fileService.saveFileInDB(fileData, dbClient);
    const fileId = newFile._id.toString();

    const userId = req.user._id;
    if (type === VALID_FILE_TYPES.image) {
      const jobName = `Image thumbnail [${userId}-${fileId}]`;
      fileQueue.add({ userId, fileId, name: jobName });
    }

    return res.status(201).json({
      id: fileId,
      userId: newFile.userId,
      name: newFile.name,
      type: newFile.type,
      isPublic: newFile.isPublic,
      parentId: newFile.parentId,
      // localPath: newFile.localPath,
    })
}}
