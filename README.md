```md
# API Biblioteca - Autenticação

## Pré-requisitos
- Node.js 18+
- PostGreSQL 13+

## Setup
```bash

cp .env.example .env
# edite .env com suas credenciais

# Crie o banco previamente, ex. no psql:
# CREATE DATABASE biblioteca;

npm install 
npm run db: migrate
npm run dev
```