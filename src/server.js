import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from "./routes/auth.routes.js";
import { pool } from './db/index.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok' });
    } catch {
        res.status(500).json({ status: 'db_error' });
    }
});

app.set('views', path.join(path.resolve(), 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(path.resolve(), 'public')));

app.get('/', (req, res) => res.render('index'));
app.get('/register', (req, res) => res.render('register'));

app.use('/api/auth', authRoutes);

const port = process.env.PORT;
app.listen(port, () => console.log(`API rodando na porta ${port}`));
