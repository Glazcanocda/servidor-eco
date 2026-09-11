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

// Inicializar archivo JSON para auditoría de tiempos
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

const sesionesActivas = new Map();

// Ruta de la vista del Dashboard de Administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// APIs para consulta y exportación de reportes
app.get('/api/reportes', (req, res) => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.json([]);
    }
});

const server = app.listen(PORT, () => {
    console.log(`Servidor de Telemedicina y Reportes activo en puerto ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true,
    alive_timeout: 60000
});

// Captura de eventos para medir la duración de la consulta radiológica
peerServer.on('connection', (client) => {
    const id = client.getId();
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

        if (duracionSegundos > 2) {
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
                console.error("Error al guardar reporte:", e);
            }
        }
        sesionesActivas.delete(id);
    }
});

app.use('/peerjs', peerServer);
