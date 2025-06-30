import express from 'express';
import { pool } from './db';
import recommendationRoutes from './api/recommendationRoutes';

const app = express();

app.use(express.json());
app.use('/api', recommendationRoutes);

export default app;