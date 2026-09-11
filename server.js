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

// Inicializar archivo de registros si no existe
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Map para rastrear tiempos de inicio de sesiones activas
const sesionesActivas = new Map();

// --- RUTAS DE NAVEGACIÓN ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- API REST PARA REPORTES ---
app.get('/api/reportes', (req, res) => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.json([]);
    }
});

app.post('/api/reportes/limpiar', (req, res) => {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
    res.json({ status: 'ok' });
});

const server = app.listen(PORT, () => {
    console.log(`Servidor Telemedicina escuchando en puerto ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true,
    alive_timeout: 60000
});

// --- AUDITORÍA DE CONEXIONES Y TIEMPOS ---
peerServer.on('connection', (client) => {
    const id = client.getId();
    // Identificar si quien se conecta es un radiólogo (receptor)
    if (id.includes('radiologo_') || !id.includes('_')) {
        sesionesActivas.set(id, { inicio: new Date() });
    }
});

peerServer.on('disconnect', (client) => {
    const id = client.getId();
    if (sesionesActivas.has(id)) {
        const sesion = sesionesActivas.get(id);
        const fin = new Date();
        const duracionSegundos = Math.round((fin - sesion.inicio) / 1000);

        if (duracionSegundos > 2) { // Guardar solo sesiones válidas mayores a 2 segundos
            const nuevoRegistro = {
                id: id,
                inicio: sesion.inicio.toLocaleString('es-CL'),
                fin: fin.toLocaleString('es-CL'),
                duracionSegundos: duracionSegundos,
                duracionFormateada: `${Math.floor(duracionSegundos / 60)}m ${duracionSegundos % 60}s`
            };

            try {
                const logs = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
                logs.unshift(nuevoRegistro);
                fs.writeFileSync(DB_FILE, JSON.stringify(logs, null, 2));
            } catch (e) {
                console.error("Error guardando reporte:", e);
            }
        }
        sesionesActivas.delete(id);
    }
});

app.use('/peerjs', peerServer);
