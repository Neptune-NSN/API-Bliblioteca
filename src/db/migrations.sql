CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    card_number TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'admin'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Regras de consistência
    CONSTRAINT email_or_card CHECK (email IS NOT NULL OR card_number IS NOT NULL),
    CONSTRAINT role_check CHECK (role IN ('student', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users ((LOWER(email)));
CREATE INDEX IF NOT EXISTS idx_users_card_number ON users (card_number);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS livros (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    autor TEXT NOT NULL,
    ano_publicacao INT,
    genero TEXT,
    quantidade_disponivel INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_livros_titulo ON livros (titulo);

DROP TRIGGER IF EXISTS livros_set_updated_at ON livros;
CREATE TRIGGER livros_set_updated_at
    BEFORE UPDATE ON livros
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
