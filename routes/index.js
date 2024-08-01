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
};

export default routeController;