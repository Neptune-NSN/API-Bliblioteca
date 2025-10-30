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
            `SELECT id, user_id AS "userId", book_id AS "bookId", status, due_at AS "dueAt", renewed_count AS "renewedCount", max_renewals AS "maxRenewals"
             FROM loans WHERE id = $1`,
            [loanId]
        );
        if (loanRes.rowCount === 0) return res.status(404).json({ error: 'Empréstimo não encontrado' });
        const loan = loanRes.rows[0];

        if (String(loan.userId) !== String(userId)) return res.status(403).json({ error: 'acesso negado' });
        if (loan.status !== 'active') return res.status(400).json({ error: 'apenas empréstimos ativos podem ser renovados' });
        if (loan.renewedCount >= loan.maxRenewals) return res.status(400).json({ error: 'limite de renovações atingido' });

        const newDueAt = new Date(new Date(loan.dueAt).getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000).toISOString();

        const upd = await query(
            `UPDATE loans SET due_at = $1, renewed_count = renewed_count + 1 WHERE id = $2 RETURNING id, due_at AS "dueAt", renewed_count AS "renewedCount"`,
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