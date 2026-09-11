const express = require('express');
const path = require('path');
const fs = require('fs');
const { ExpressPeerServer } = require('peer');

const app = express();
app.enable('trust proxy');
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 9000;
const DB_FILE = path.join(__dirname, 'sesiones.json');

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Guarda temporalmente el tiempo de inicio por socket
const llamadasActivas = new Map();

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/reportes', (req, res) => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.json([]);
    }
});

// Registrar fin de llamada de forma precisa desde la web
app.post('/api/reportes/registrar', (req, res) => {
    const { centro, sala, radiologo, duracionSegundos, inicio, fin } = req.body;

    if (!duracionSegundos || duracionSegundos < 2) return res.json({ status: 'ignored' });

    const nuevoRegistro = {
        centro: centro || 'No Especificado',
        sala: sala || 'No Especificada',
        radiologo: radiologo || 'Radiólogo Anónimo',
        inicio: inicio,
        fin: fin,
        duracionSegundos: duracionSegundos,
        duracionFormateada: `${Math.floor(duracionSegundos / 60)}m ${duracionSegundos % 60}s`
    };

    try {
        const logs = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        logs.unshift(nuevoRegistro);
        fs.writeFileSync(DB_FILE, JSON.stringify(logs, null, 2));
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true,
    alive_timeout: 60000
});

app.use('/peerjs', peerServer);
