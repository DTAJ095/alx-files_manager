import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';
import fs from 'fs';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

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
        const thumbnailPath = `${localPath}_${width}`;

        await fs.writeFile(thumbnailPath, thumbnail);
    });
});

userQueue.process(async (job) => {
    const { userId } = job.data;

    if (!userId) throw new Error('Missing userId');

    const user = await dbClient.db.collection('users').findOne({ _id: userId });
    if (!user) throw new Error('User not found');

    const { email } = user;
    console.log(`Welcome to the queue ${email}`);
});
