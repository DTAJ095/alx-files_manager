import { expect } from 'chai';
import chaiHttp from 'chai-http';
import dbClient from '../../utils/db';

chai.use(chaiHttp);

describe('FileController', function() {
    before(async function() {
        await dbClient.db.collection('users').deleteMany({});
        await dbClient.db.collection('files').deleteMany({});
    });
    after(async function() {
        await dbClient.db.collection('users').deleteMany({});
        await dbClient.db.collection('files').deleteMany({});
    });
    it('GET /files', function(done) {
        chai.request(app)
        .get('/files')
        .end(function(err, res) {
            expect(res).to.have.status(200);
            expect(res.body).to.eql([]);
            done();
        });
    });
    it('POST /files', function(done) {
        chai.request(app)
        .post('/files')
        .send({ name: 'file1', type: 'type1', isPublic: true })
        .end(function(err, res) {
            expect(res).to.have.status(201);
            expect(res.body).to.have.property('id');
            done();
        });
    });
    it('GET /files', function(done) {
        chai.request(app)
        .get('/files')
        .end(function(err, res) {
            expect(res).to.have.status(200);
            expect(res.body).to.eql([{ name: 'file1', type: 'type1', isPublic: true }]);
            done();
        });
    });

    it('Get /files with pagination', function(done) {
        chai.request(app)
        .get('/files')
        .query({ page: 1, limit: 1 })
        .end(function(err, res) {
            expect(res).to.have.status(200);
            expect(res.body).to.eql([{ name: 'file1', type: 'type1', isPublic: true }]);
            done();
        });
    });

    it('GET /files/:id', function(done) {
        chai.request(app)
        .get('/files/1')
        .end(function(err, res) {
            expect(res).to.have.status(200);
            expect(res.body).to.eql({ name: 'file1', type: 'type1', isPublic: true });
            done();
        });
    });
    it('PUT /files/:id/publish', function(done) {
        chai.request(app)
        .put('/files/1/publish')
        .end(function(err, res) {
            expect(res).to.have.status(200);
            expect(res.body).to.eql({ name: 'file1', type: 'type1', isPublic: true });
            done();
        });
    });
    it('PUT /files/:id/unpublish', function(done) {
        chai.request(app)
        .put('/files/1/unpublish')
        .end(function(err, res) {
            expect(res).to.have.status(200);
            expect(res.body).to.eql({ name: 'file1', type: 'type1', isPublic: false });
            done();
        });
    });
});
