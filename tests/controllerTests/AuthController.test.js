import { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';


chai.use(chaiHttp);

const mockUser = { email: 'asgdjahgsd@gmail.com', password: 'mypasss2365' };
let token = '';

describe('AuthController', function() {

    before(async function() {
        await dbClient.db.collection('users').deleteMany({});
        await dbClient.db.collection('users').insertOne({ email: mockUser.email, password: mockUser.password });
    });
});

describe('Get user connect', function() {
    it('GET /connect', function(done) {
        chai.request(app)
            .get('/connect')
            .auth(mockUser.email, mockUser.password)
            .end(function(err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('token');
                token = res.body.token;
                done();
            });
    });
});

describe('Get user disconnect', function() {
    it('GET /disconnect', function(done) {
        chai.request(app)
            .get('/disconnect')
            .set('X-Token', token)
            .end(function(err, res) {
                expect(res).to.have.status(204);
                done();
            });
    });
});
