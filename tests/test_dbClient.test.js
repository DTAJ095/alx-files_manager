import { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../utils/db';

chai.use(chaiHttp);

describe('testing MongoDB client', () => {
  Before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  after(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  it('testing isAlive() function', () => {
    expect(dbClient.isAlive()).to.equal(true);
  });

  it('testing nbUsers() function', async () => {
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.be.a('number');
  });

  it('testing nbFiles() function', async () => {
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.be.a('number');
  });

  it('counting number of users', async () => {
    await dbClient.db.collection('users').insertOne({ email: 'aljsdkjas@gmail.com', password: 'mypasss2365' });
    await dbClient.db.collection('users').insertOne({ email: 'uoisdoof@gmail.com', password: 'mypasss78895' });
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.equal(2);
  });

  it('counting number of files', async () => {
    await dbClient.db.collection('files').insertOne({ name: 'file1', type: 'type1', parentId: 'parent1' });
    await dbClient.db.collection('files').insertOne({ name: 'file2', type: 'type2', parentId: 'parent2' });
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.equal(2);
  });
});
