// MongoDB utils
import { MongoClient } from 'mongodb';

const PORT = process.env.DB_PORT || 27017;
const HOST = process.env.DB_HOST || 'localhost';
const DATABASE = process.env.DB_DATABASE || 'files_manager';
const URL = `mongodb://${HOST}:${PORT}`;


class DBClient {
    constructor() {
        this.db = null;
        MongoClient.connect(URL, { useUnifiedTopology: true }, (err, client) => {
            if (err) console.log(err.message);
            else {
                this.db = client.db(DATABASE);
                this.db.createCollection('users');
                this.db.createCollection('files');
            }
        });
    }
    
    isAlive() {
        return !!this.db;
    }
    
    async nbUsers() {
        return this.db.collection('users').countDocuments();
    }
    
    async nbFiles() {
        return this.db.collection('files').countDocuments();
    }

}

const dbClient = new DBClient();
export default dbClient;
