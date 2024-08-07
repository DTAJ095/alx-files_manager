import { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';

chai.use(chaiHttp);

describe('UserController', function() {
    before(async function() {
        await dbClient.db.collection('users').deleteMany({});
    });
    after(async function() {
        await dbClient.db.collection('users').deleteMany({});
    });
    it('POST /users', function(done) {
        chai.request(app)
        .post('/users')
        .send({ email: 'hasaanmad@gmail.com', password: 'mypasss2365' }).end(function(err, res) {
            expect(res).to.have.status(201);
            expect(res.body).to.have.property('id');
            done();
        });
    });

    it('Post with existing email', function(done) {
        chai.request(app)
        .post('/users')
        .send({ email: 'hasaanmaad@gmail.com', password: 'mypasss2365' }).end(function(err, res) {
            expect(res).to.have.status(400);
            expect(res.body).to.eql({ error: 'Already exist' });
            done();
        });
    });

    it ('Get /users/me', function(done) {
        chai.request(app)
        .get('/users/me')
        .end(function(err, res) {
            expect(res).to.have.status(200);
            expect(res.body).to.eql({ email: 'hasaanmad@gmail.com' });
            done();
        });
    });
});
