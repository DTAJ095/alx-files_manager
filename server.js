import express from 'express';
import controllerRouting from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
controllerRouting(app);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
