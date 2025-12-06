import express from 'express';
import {
  requestLoan,
  renewLoan,
  myActiveLoans,
  adminListPendingLoans,
  adminApproveLoan,
  adminRejectLoan,
  adminListAllLoans,
  adminReturnLoan
} from '../controllers/loans.controller.js';

import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/request', requestLoan);
router.post('/renew/:loanId', renewLoan);
router.get('/me', myActiveLoans);

router.get('/admin/pending', requireAdmin, adminListPendingLoans);
router.post('/admin/:loanId/approve', requireAdmin, adminApproveLoan);
router.post('/admin/:loanId/reject', requireAdmin, adminRejectLoan);
router.get('/admin/all', requireAdmin, adminListAllLoans);
router.post('/admin/:loanId/return', requireAdmin, adminReturnLoan);

export default router;