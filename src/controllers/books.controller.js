import { pool } from '../db/index.js';

export const listAvailableBooks = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, author, available_copies FROM books WHERE available_copies > 0 ORDER BY title'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao consultar livros disponíveis' });
  }
};
