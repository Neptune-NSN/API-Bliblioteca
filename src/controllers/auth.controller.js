import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { normalizeEmail, isIntitutionalEmail } from "../utils/validators.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function register(req, res) {
    try {
        let { name, email, cardNumber, password, role } = req.body;

        if (!name || !password || (!email && !cardNumber)) {
            return res.status(400).json({ error: 'name, password e (email ou cardNumber) são obrigatórios' });
        }

        if (email) {
            email = normalizeEmail(email);
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                return res.status(400).json({ error: 'email inválido' });
            }
            if (!isIntitutionalEmail(email)) {
                return res.status(400).json({ error: 'email não pertence ao domínio institucional permitido' });
            }
        }

        if (cardNumber && !/^[0-9]{12}$/.test(cardNumber)) {
            return res.status(400).json({ error: 'cardNumber inválido' });
        }

        if (role && !['student', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'role inválida' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        if (email) {
            const dupe = await query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [email]);
            if (dupe.rowCount > 0) return res.status(409).json({ error: 'email já cadastrado' });
        }
        if (cardNumber) {
            const dupe2 = await query('SELECT 1 FROM users WHERE card_number = $1', [cardNumber]);
            if (dupe2.rowCount > 0) return res.status(409).json({ error: 'cardNumber já cadastrado' });
        }

        const insert = await query(
            `INSERT INTO users (name, email, card_number, password_hash, role)
            VALUES($1, $2, $3, $4, COALESCE($5, 'student'))
            RETURNING id, name, email, card_number AS "cardNumber", role, created_at AS "createdAt"`,
            [name, email || null, cardNumber || null, passwordHash, role || null]
        );

        const user = insert.rows[0];
        const token = signToken({ sub: String(user.id), role: user.role });

        return res.status(201).json({ token, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    }
}

export async function login(req, res) {
    try {
        let { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: 'identifier e password são obrigatórios' });
        }

        let userRes;
        if(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier)) {
            const email = normalizeEmail(identifier);
            userRes = await query(
                `SELECT id, name, email, card_number AS "cardNumber", role, password_hash
                FROM users WHERE LOWER(email) = LOWER($1)`,
                [email]
            );
        } else {
            const cardNumber = identifier;
            userRes = await query(
                `SELECT id, name, email, card_number AS "cardNumber", role, password_hash
                FROM users WHERE card_number = $1`,
                [cardNumber]
            );
        }

        if (userRes.rowCount === 0) {
            return res.status(401).json({ error: 'credenciais inválidas' });
        }

        const user = userRes.rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'credenciais inválidas' });

        const token = signToken({ sub: String(user.id), role: user.role});

        delete user.password_hash;
        return res.json({ token, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'erro interno' });
    }
}
