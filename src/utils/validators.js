export function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

export function isIntitutionalEmail(email) {
    return /@uel\.br$/i.test(email);
}