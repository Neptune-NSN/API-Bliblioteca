import { pool, query } from '../db/index.js';
import crypto from 'crypto';

const LOAN_DAYS = parseInt(process.env.LOAN_DAYS || '14', 10);
const MAX_RENEWALS_DEFAULT = parseInt(process.env.MAX_RENEWALS || '2', 10);

function generatePickupCode() {
    return crypto.randomBytes(4).toString('hex');
}

export async function requestLoan(req, res) {
    const userId = req.user.id;
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: 'bookId é obrigatório' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const bookRes = await client.query(
            'SELECT id, title, available_copies FROM books WHERE id = $1 FOR UPDATE',
            [bookId]
        );

        if (bookRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Livro não encontrado' });
        }

        const book = bookRes.rows[0];
        if (book.available_copies <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Nenhuma cópia disponível' });
        }

        const pickupCode = generatePickupCode();
        const dueAt = new Date(Date.now() + LOAN_DAYS * 24 * 60 * 60 * 1000).toISOString();
        const maxRenewals = MAX_RENEWALS_DEFAULT;

        const insertRes = await client.query(
            `INSERT INTO loans (book_id, user_id, pickup_code, status, borrowed_at, due_at, renewed_count, max_renewals)
             VALUES ($1, $2, $3, 'requested', NOW(), $4, 0, $5)
             RETURNING id, pickup_code, due_at, borrowed_at, renewed_count, max_renewals`,
            [bookId, userId, pickupCode, dueAt, maxRenewals]
        );

        await client.query('COMMIT');

        return res.status(201).json({
            message: 'Empréstimo solicitado. Aguardando aprovação do administrador.',
            loan: insertRes.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    } finally {
        client.release();
    }
}

export async function renewLoan(req, res) {
    const userId = req.user.id;
    const { loanId } = req.params;

    try {
        const loanRes = await query(
            `SELECT id, user_id AS "userId", book_id AS "bookId", status, due_at AS "dueAt",
                    renewed_count AS "renewedCount", max_renewals AS "maxRenewals"
             FROM loans WHERE id = $1`,
            [loanId]
        );
        if (loanRes.rowCount === 0) return res.status(404).json({ error: 'Empréstimo não encontrado' });

        const loan = loanRes.rows[0];

        if (String(loan.userId) !== String(userId))
            return res.status(403).json({ error: 'acesso negado' });

        if (loan.status !== 'active')
            return res.status(400).json({ error: 'apenas empréstimos ativos podem ser renovados' });

        if (loan.renewedCount >= loan.maxRenewals)
            return res.status(400).json({ error: 'limite de renovações atingido' });

        const newDueAt = new Date(new Date(loan.dueAt).getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000).toISOString();

        const upd = await query(
            `UPDATE loans SET due_at = $1, renewed_count = renewed_count + 1
             WHERE id = $2
             RETURNING id, due_at AS "dueAt", renewed_count AS "renewedCount"`,
            [newDueAt, loanId]
        );

        return res.json({ loan: upd.rows[0] });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    }
}

export async function myActiveLoans(req, res) {
    const userId = req.user.id;

    try {
        const loansRes = await query(
            `SELECT l.id, l.pickup_code AS "pickupCode", l.status, l.borrowed_at AS "borrowedAt",
                    l.due_at AS "dueAt", l.renewed_count AS "renewedCount", l.max_renewals AS "maxRenewals",
                    b.id AS "bookId", b.title, b.author
             FROM loans l
             JOIN books b ON b.id = l.book_id
             WHERE l.user_id = $1 AND l.status = 'active'
             ORDER BY l.borrowed_at DESC`,
            [userId]
        );
        return res.json({ loans: loansRes.rows });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    }
}

export async function adminListPendingLoans(req, res) {
    try {
        const pending = await query(
            `SELECT
                l.id, l.book_id AS "bookId", l.user_id AS "userId",
                l.pickup_code AS "pickupCode", l.status,
                l.borrowed_at AS "borrowedAt", l.due_at AS "dueAt",
                u.name AS "userName", u.email AS "userEmail",
                b.title AS "bookTitle"
             FROM loans l
             JOIN users u ON u.id = l.user_id
             JOIN books b ON b.id = l.book_id
             WHERE l.status = 'requested'
             ORDER BY l.borrowed_at ASC`
        );

        return res.json({ pending: pending.rows });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    }
}

export async function adminApproveLoan(req, res) {
    const { loanId } = req.params;
    const adminId = req.user.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const loanRes = await client.query(
            `SELECT id, book_id AS "bookId", status FROM loans WHERE id = $1 FOR UPDATE`,
            [loanId]
        );

        if (loanRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Empréstimo não encontrado' });
        }

        const loan = loanRes.rows[0];

        if (loan.status !== 'requested') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Empréstimo já processado' });
        }

        const bookUpdate = await client.query(
            `UPDATE books SET available_copies = available_copies - 1
             WHERE id = $1 AND available_copies > 0
             RETURNING available_copies`,
            [loan.bookId]
        );

        if (bookUpdate.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Não há cópias disponíveis' });
        }

        await client.query(
            `UPDATE loans
             SET status = 'active', approved_by = $1, updated_at = NOW()
             WHERE id = $2`,
            [adminId, loanId]
        );

        await client.query('COMMIT');

        return res.json({ message: 'Empréstimo aprovado com sucesso' });

    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    } finally {
        client.release();
    }
}

export async function adminRejectLoan(req, res) {
    const { loanId } = req.params;
    const adminId = req.user.id;

    try {
        const loanRes = await query(
            `SELECT id, status FROM loans WHERE id = $1`,
            [loanId]
        );

        if (loanRes.rowCount === 0)
            return res.status(404).json({ error: 'Empréstimo não encontrado' });

        const loan = loanRes.rows[0];

        if (loan.status !== 'requested')
            return res.status(400).json({ error: 'Empréstimo já processado' });

        await query(
            `UPDATE loans
             SET status = 'rejected', approved_by = $1, updated_at = NOW()
             WHERE id = $2`,
            [adminId, loanId]
        );

        return res.json({ message: 'Empréstimo rejeitado com sucesso' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    }
}

export async function adminListAllLoans(req, res) {
    try {
        const result = await query(
            `SELECT 
                l.id, l.status, l.borrowed_at AS "borrowedAt", l.due_at AS "dueAt",
                l.renewed_count AS "renewedCount", l.max_renewals AS "maxRenewals",
                u.name AS "userName", u.email AS "userEmail",
                b.title AS "bookTitle"
            FROM loans l
            JOIN users u ON u.id = l.user_id
            JOIN books b ON b.id = l.book_id
            ORDER BY 
                (l.status = 'active' AND l.due_at < NOW()) DESC, -- atrasados primeiro
                l.borrowed_at DESC`
        );

        return res.json({ loans: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    }
}

export async function adminReturnLoan(req, res) {
    const { loanId } = req.params;

    try {
        const updateLoan = await query(
            `UPDATE loans 
             SET status = 'returned', returned_at = NOW()
             WHERE id = $1 AND status = 'active'
             RETURNING book_id`,
            [loanId]
        );

        if (updateLoan.rows.length === 0) {
            return res.status(400).json({ message: "Empréstimo inválido ou já devolvido." });
        }

        const bookId = updateLoan.rows[0].book_id;

        await query(
            `UPDATE books 
             SET available_copies = available_copies + 1 
             WHERE id = $1`,
            [bookId]
        );

        return res.json({ message: "Livro marcado como devolvido com sucesso!" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Erro ao marcar devolução." });
    }
}
