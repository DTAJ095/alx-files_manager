import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
    const { userId, fileId } = job.data;

    if (!userId) throw new Error('Missing userId');
    if (!fileId) throw new Error('Missing fileId');

    const file = await dbClient.db.collection('files').findOne({ _id: fileId, userId });
    if (!file) throw new Error('File not found');

    const { localPath } = file;
    const options = {};
    const widths = [100, 250, 500];

    widths.forEach(async (width) => {
        options.width = width;
        const thumbnail = await imageThumbnail(localPath, options);
        const thumbnailPath = `${localPath}_${width}.jpg`;

        await fs.writeFile(thumbnailPath, thumbnail);
    });
});