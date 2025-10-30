CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    card_number TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT email_or_card CHECK (email IS NOT NULL OR card_number IS NOT NULL),
    CONSTRAINT email_uel_check CHECK (LOWER(email) LIKE '%@uel.br')
    );

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users ((LOWER(email)));
CREATE INDEX IF NOT EXISTS idx_users_card_number ON users (card_number);

CREATE OR REPLACE FUNCTION set_updated_at()
       RETURNS TRIGGER AS $$
       BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_title ON books (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_books_available ON books (available_copies);

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pickup_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    borrowed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    renewed_count INT NOT NULL DEFAULT 0,
    max_renewals INT NOT NULL DEFAULT 2,
    returned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_active ON loans (user_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_book_id ON loans (book_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS books_set_updated_at ON books;
CREATE TRIGGER books_set_updated_at
BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS loans_set_updated_at ON loans;
CREATE TRIGGER loans_set_updated_at
BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE loans
ADD COLUMN approved_by UUID NULL REFERENCES users(id);