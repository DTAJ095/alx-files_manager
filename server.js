import express from 'express';
import routeController from './routes';

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
routeController(app);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
