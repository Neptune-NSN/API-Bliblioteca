import pool from "../db.js";

export async function criarLivro(req, res) {
  const { titulo, autor, ano_publicacao, genero, quantidade_disponivel } = req.body;

  if (!titulo || !autor || !ano_publicacao || quantidade_disponivel == null) {
    return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO livros (titulo, autor, ano_publicacao, genero, quantidade_disponivel)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [titulo, autor, ano_publicacao, genero, quantidade_disponivel]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar livro:", err);
    res.status(500).json({ error: "Erro ao criar livro" });
  }
}

export async function editarLivro(req, res) {
  const { id } = req.params;
  const { titulo, autor, ano_publicacao, genero, quantidade_disponivel } = req.body;

  try {
    const result = await pool.query(
      `UPDATE livros 
       SET titulo = $1, autor = $2, ano_publicacao = $3, genero = $4, quantidade_disponivel = $5, atualizado_em = NOW()
       WHERE id = $6 RETURNING *`,
      [titulo, autor, ano_publicacao, genero, quantidade_disponivel, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Livro não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao editar livro:", err);
    res.status(500).json({ error: "Erro ao editar livro" });
  }
}

export async function removerLivro(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(`DELETE FROM livros WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Livro não encontrado" });
    }

    res.json({ message: "Livro removido com sucesso" });
  } catch (err) {
    console.error("Erro ao remover livro:", err);
    res.status(500).json({ error: "Erro ao remover livro" });
  }
}

export async function listarLivros(req, res) {
  try {
    const result = await pool.query("SELECT * FROM livros ORDER BY titulo ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar livros:", err);
    res.status(500).json({ error: "Erro ao buscar livros" });
  }
}