import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';
import app from '../../server';

use(chaiHttp);

describe('appController', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  after(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  it('gET /status', () => new Promise((done) => {
    chai.request(app)
      .get('/status')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({ redis: true, db: true });
        done();
      });
  }));
  it('gET /stats', () => new Promise((done) => {
    chai.request(app)
      .get('/stats')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({ users: 0, files: 0 });
        done();
      });
  }));
});
