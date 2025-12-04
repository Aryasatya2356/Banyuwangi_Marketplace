const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware Autentikasi (yang sudah ada)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Akses ditolak, token tidak ditemukan' });
    }

    jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
        if (err){
            return res.status(403).json({ error: 'Token tidak valid atau kadaluwarsa'});
        }
        req.user = decodedPayload.user;
        next();
    });
}

// Middleware Autorisasi (BARU)
function authorizeRole(role) {
    return (req, res, next) => {
        // Middleware ini harus dijalankan SETELAH autheticateToken
        if (req.user && req.user.role === role) {
            next();
        } else {
            //pengguna terautentikasi, tetapi  tidak memiliki izin
            return res.status(403).json({ error: 'Akses Dilarang: Peran tidak memadai' });
        }
    };
}

module.exports = { 
    authenticateToken, 
    authorizeRole 
};