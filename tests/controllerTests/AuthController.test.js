import { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';

use(chaiHttp);

const mockUser = { email: 'asgdjahgsd@gmail.com', password: 'mypasss2365' };
let token = '';

describe('authController', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await dbClient.db.collection('users').insertOne({ email: mockUser.email, password: mockUser.password });
  });
});

describe('get user connect', () => {
  it('gET /connect', () => new Promise((done) => {
    chai.request(app)
      .get('/connect')
      .auth(mockUser.email, mockUser.password)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('token');
        token = res.body.token;
        done();
      });
  }));
});

describe('get user disconnect', () => {
  it('gET /disconnect', () => new Promise((done) => {
    chai.request(app)
      .get('/disconnect')
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(204);
        done();
      });
  }));
});
