import http from 'http';
import dotenv from 'dotenv';
import app from '../app.js';

dotenv.config();

const port = process.env.PORT || 3000;
app.set('port', port);

const server = http.createServer(app);