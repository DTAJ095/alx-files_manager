import express from 'express';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
routes(app);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
