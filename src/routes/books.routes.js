import express from 'express';

import {
  listAvailableBooks,
  adminListBooks,
  adminCreateBook,
  adminUpdateBook,
  adminDeleteBook
} from '../controllers/books.controller.js';

import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/available', listAvailableBooks);

router.get('/admin/books', requireAuth, requireAdmin, adminListBooks);
router.post('/admin/books', requireAuth, requireAdmin, adminCreateBook);
router.put('/admin/books/:id', requireAuth, requireAdmin, adminUpdateBook);
router.delete('/admin/books/:id', requireAuth, requireAdmin, adminDeleteBook);

export default router;
