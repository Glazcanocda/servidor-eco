const express = require('express');
const { ExpressPeerServer } = require('peer');

const app = express();
app.enable('trust proxy');

const PORT = process.env.PORT || 9000;

app.get('/', (req, res) => {
    res.send('Servidor de Señalización Ecográfica Activo');
});

const server = app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true,
    alive_timeout: 60000 // Aumenta la tolerancia de desconexión a 60 segundos
});

app.use('/peerjs', peerServer);
