import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import livrosRoutes from './routes/livrosRoutes.js';
import { pool } from './db/index.js';

dotenv.config();

const app = express();

app.set('views', path.join(path.resolve(), 'views'));
app.set('view engine', 'pug');

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), 'public')));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'db_error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/livros', livrosRoutes);

app.get('/', (req, res) => res.render('index'));

app.use((req, res, next) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API rodando na porta ${port}`));