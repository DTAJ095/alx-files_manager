import express from 'express';
import AppController from '../controllers/AppController.js';
import UsersController from '../controllers/UsersController.js';


const router = express.Router();

function routeController(app) {
    app.use('/', router);

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
    });
};

export default routeController;