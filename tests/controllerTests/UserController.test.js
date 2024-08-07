import { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';

use(chaiHttp);

describe('userController', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
  });
  after(async () => {
    await dbClient.db.collection('users').deleteMany({});
  });
  it('pOST /users', () => new Promise((done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'hasaanmad@gmail.com', password: 'mypasss2365' }).end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        done();
      });
  }));

  it('post with existing email', () => new Promise((done) => {
    chai.request(app)
      .post('/users')
      .send({ email: 'hasaanmaad@gmail.com', password: 'mypasss2365' }).end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.eql({ error: 'Already exist' });
        done();
      });
  }));

  it('get /users/me', () => new Promise((done) => {
    chai.request(app)
      .get('/users/me')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({ email: 'hasaanmad@gmail.com' });
        done();
      });
  }));
});
