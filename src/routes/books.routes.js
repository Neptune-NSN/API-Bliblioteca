import express from 'express';
import { listAvailableBooks } from '../controllers/books.controller.js';

const router = express.Router();

router.get('/available', listAvailableBooks);

export default router;
