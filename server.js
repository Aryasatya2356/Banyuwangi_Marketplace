const express = require('express');
const cors = require('cors');
const db = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => {
    res.json({ ok: true, service: 'film-api_punya arya' });
});
// vendor A Wempi
app.get('/vendor-a', async(req, res, next) => {
    const sql = 'SELECT id, kd_produk, nm_brg, hrg, ket_stok FROM vendor_a ORDER BY id ASC';
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

app.get('/vendor-a/:id', async (req, res, next)=>{
    const sql = 'SELECT id, kd_produk, nm_brg, hrg, ket_stok FROM vendor_a where id = $1';
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rowCount.length ===0){
            return res.status(404).json({ error: 'Produk tidak ditemukan'});
        }
        res.json(result.rows[0]);
    }catch (err){
        next(err);
    }
}); 




app.use((req, res) => {
    res.status(404).json({ error: 'Rute tidak ditemukan' });
});

app.use((err,req,res,next) =>{ 
    console.error('[SERVERERROR]',err.stack); 
    res.status(500).json({error:'Terjadikesalahanpadaserver'}); 
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});

module.exports = app;