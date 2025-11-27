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

export const adminListBooks = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY title');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar livros' });
  }
};

export const adminCreateBook = async (req, res) => {
  const { title, author, isbn, total_copies } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO books (title, author, isbn, total_copies, available_copies)
      VALUES ($1, $2, $3, $4, $4)
      RETURNING *
      `,
      [title, author, isbn, total_copies]
    );

    res.status(201).json({
      message: "Livro criado com sucesso",
      book: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar livro' });
  }
};

export const adminUpdateBook = async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, total_copies, available_copies } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE books
      SET title = $1, author = $2, isbn = $3,
          total_copies = $4, available_copies = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
      `,
      [title, author, isbn, total_copies, available_copies, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Livro não encontrado" });

    res.json({
      message: "Livro atualizado com sucesso",
      book: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar livro' });
  }
};

export const adminDeleteBook = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM books WHERE id = $1 RETURNING id", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Livro não encontrado" });

    res.json({ message: "Livro removido com sucesso" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover livro" });
  }
};