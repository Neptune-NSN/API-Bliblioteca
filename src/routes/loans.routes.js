import express from 'express';
import { requestLoan, renewLoan, myActiveLoans } from '../controllers/loans.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/request', requestLoan);
router.post('/renew/:loanId', renewLoan);
router.get('/me', myActiveLoans);

export default router;
