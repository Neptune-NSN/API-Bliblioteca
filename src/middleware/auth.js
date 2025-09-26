import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next){
    try {
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'token ausente' });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.sub, role: payload.role };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'token expirado ou inválido' });
    }
}

export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'acesso restrito a administradores' });
    }
    next();
}