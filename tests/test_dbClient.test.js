import { expect } from "chai";
import chaiHttp from "chai-http";
import dbClient from "../utils/db";

chai.use(chaiHttp);

describe('Testing MongoDB client', function() {
  Before(async function() {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  after(async function() {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  it('Testing isAlive() function', function() {
    expect(dbClient.isAlive()).to.equal(true);
  });

  it('Testing nbUsers() function', async function() {
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.be.a('number');
  });

  it('Testing nbFiles() function', async function() {
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.be.a('number');
  });

  it('Counting number of users', async function() {
    await dbClient.db.collection('users').insertOne({ email: 'aljsdkjas@gmail.com', password: 'mypasss2365' });
    await dbClient.db.collection('users').insertOne({ email: 'uoisdoof@gmail.com', password: 'mypasss78895' });
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.equal(2);
  });

  it('Counting number of files', async function() {
    await dbClient.db.collection('files').insertOne({ name: 'file1', type: 'type1', parentId: 'parent1' });
    await dbClient.db.collection('files').insertOne({ name: 'file2', type: 'type2', parentId: 'parent2' });
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.equal(2);
  });
});
