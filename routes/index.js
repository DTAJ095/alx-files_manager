import express from 'express';
import AppController from '../controllers/app.controller.js';


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
        AppController.postNew(req, res);
    });

    router.get('/connect', (req, res) => {
        AppController.connect(req, res);
    });

    router.get('/disconnect', (req, res) => {
        AppController.disconnect(req, res);
    });

    router.get('/users/me', (req, res) => {
        AppController.getMe(req, res);
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
};

export default routeController;