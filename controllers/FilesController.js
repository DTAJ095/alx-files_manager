import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { mkdir, readFileSync, writeFile } from 'fs';
import Queue from 'bull';
<<<<<<< HEAD
import dbClient from '../utils/db';
import { getIdAndKey } from '../utils/users';
=======
import { getIdAndKey } from '../utils/user';
>>>>>>> 4a3aa4d (updated)

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const VALID_TYPES = ['folder', 'file', 'image', 'video'];
const queue = new Queue('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const { userId } = await getIdAndKey(req);
    const { user } = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const fileParams = {
      userId,
      name: req.body.name,
      type: req.body.type,
      isPublic: req.body.isPublic || false,
      parentId: req.body.parentId || 0,
      data: req.body.data,
    };

    if (!fileParams.name) return res.status(400).send({ error: 'Missing name' });
    if (!fileParams.type || !VALID_TYPES.includes(fileParams.type)) return res.status(400).send({ error: 'Missing type' });
    if (!fileParams.data && fileParams.type !== 'folder') return res.status(400).send({ error: 'Missing data' });

    const parent = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileParams.parentId) });
    if (!parent) return res.status(400).send({ error: 'Parent not found' });
    if (fileParams.type !== 'folder' && parent.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });

    const fileData = {
      userId: user._id,
      name: fileParams.name,
      type: fileParams.type,
      isPublic: fileParams.isPublic,
      parentId: fileParams.parentId,
    };

    if (fileParams.type === 'folder') {
      await dbClient.db.collection('files').insertOne(fileData);
      return res.status(201).send(fileData);
    }

    const filename = `${uuidv4()}`;
    const buffer = Buffer.from(fileParams.data, 'base64');
    const filepath = `${FOLDER_PATH}/${filename}`;

    mkdir(FOLDER_PATH, { recursive: true }, (err) => {
      if (err) return res.status(400).send({ error: err.message });
    });

    writeFile(filepath, buffer, (err) => {
      if (err) return res.status(400).send({ error: err.message });
    });

    fileData.localPath = filepath;
    await dbClient.db.collection('files').insertOne(fileData);

    queue.add({
      userId: user._id,
      fileId: fileData._id,
      localPath: filepath,
    });

    return res.status(201).send({
      userId: user._id,
      name: fileData.name,
      type: fileData.type,
      isPublic: fileData.isPublic,
      parentId: fileData.parentId,
      localPath,
    });
  }
}

export default FilesController;
