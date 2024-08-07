import { expect, use, before, after } from 'chai';
import { describe, before, after } from 'mocha';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';
import app from '../../server';

use(chaiHttp);

describe('fileController', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  after(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('files').deleteMany({});
  });
  it('gET /files', () => new Promise((done) => {
    chai.request(app)
      .get('/files')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql([]);
        done();
      });
  }));
  it('pOST /files', () => new Promise((done) => {
    chai.request(app)
      .post('/files')
      .send({ name: 'file1', type: 'type1', isPublic: true })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        done();
      });
  }));
  it('gET /files', () => new Promise((done) => {
    chai.request(app)
      .get('/files')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql([{ name: 'file1', type: 'type1', isPublic: true }]);
        done();
      });
  }));

  it('get /files with pagination', () => new Promise((done) => {
    chai.request(app)
      .get('/files')
      .query({ page: 1, limit: 1 })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql([{ name: 'file1', type: 'type1', isPublic: true }]);
        done();
      });
  }));

  it('gET /files/:id', () => new Promise((done) => {
    chai.request(app)
      .get('/files/1')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({ name: 'file1', type: 'type1', isPublic: true });
        done();
      });
  }));
  it('pUT /files/:id/publish', () => new Promise((done) => {
    chai.request(app)
      .put('/files/1/publish')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({ name: 'file1', type: 'type1', isPublic: true });
        done();
      });
  }));
  it('pUT /files/:id/unpublish', () => new Promise((done) => {
    chai.request(app)
      .put('/files/1/unpublish')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({ name: 'file1', type: 'type1', isPublic: false });
        done();
      });
  }));
});
