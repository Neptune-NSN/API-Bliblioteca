import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.routes.js';

import indexRouter from './src/routes/index.js';
import usersRouter from './src/routes/users.js';
import userRouter from './src/routes/user.routes.js';
import booksRoutes from './src/routes/books.routes.js';
import loansRoutes from './src/routes/loans.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/books', booksRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/auth', authRoutes);
app.use('/user', userRouter);

app.use((req, res, next) => next(createError(404)));

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;
