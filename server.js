const express = require('express');
const { ExpressPeerServer } = require('peer');

const app = express();
const PORT = process.env.PORT || 9000;

// Ruta principal para confirmación de estado de Render
app.get('/', (req, res) => {
    res.send('Servidor de Señalización Ecográfica Activo y Funcionando');
});

// Inicializar el servidor HTTP
const server = app.listen(PORT, () => {
    console.log(`Servidor iniciado y escuchando en el puerto ${PORT}`);
});

// Adjuntar el servidor PeerJS a Express
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);
