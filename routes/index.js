import express from 'express';
import AppController from '../controllers/app.controller.js';
import FilesController from '../controllers/files.controller.js';
import UsersController from '../controllers/UsersController.js';
import AuthController from '../controllers/AuthController.js';


const router = express.Router();

const routeController = (app) => {
    app.use('/api', router);

    router.get('/status', (req, res) => {
        AppController.getStatus(req, res);
    });

    router.get('/stats', (req, res) => {
        AppController.getStats(req, res);
    });

    router.post('/users', (req, res) => {
        UsersController.postNew(req, res);
    });

    router.get('/connect', (req, res) => {
        AuthController.connect(req, res);
    });

    router.get('/disconnect', (req, res) => {
        AuthController.disconnect(req, res);
    });

    router.get('/users/me', (req, res) => {
        UsersController.getMe(req, res);
    });

    router.post('/files', (req, res) => {
        FilesController.postUpload(req, res);
    });
    router.get('/files/:id', (req, res) => {
        FilesController.getShow(req, res);
    });
    router.get('/files', (req, res) => {
        FilesController.getIndex(req, res);
    });
    router.put('/files/:id/publish', (req, res) => {
        FilesController.putPublish(req, res);
    });
    router.put('/files/:id/unpublish', (req, res) => {
        FilesController.putUnpublish(req, res);
    });
    router.get('/files/:id/data', (req, res) => {
        FilesController.getFile(req, res);
    });
};

export default routeController;