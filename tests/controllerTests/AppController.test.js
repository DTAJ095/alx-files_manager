import { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';
import app from '../../server';

use(chaiHttp);

describe('AppController', function() {
  before(async function() {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  after(async function() {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  it('GET /status', function(done) {
    chai.request(app)
      .get('/status')
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({ redis: true, db: true });
        done();
      });
  });
  it('GET /stats', function(done) {
    chai.request(app)
      .get('/stats')
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({ users: 0, files: 0 });
        done();
      });
  });
});
