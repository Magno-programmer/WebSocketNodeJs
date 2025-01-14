'use strict';
/* Feito pelo Carlos Magno Nobre da Silva
 * Email: carlosmagnoprogrammer@gmail.com
*/
const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const { handleSocketEvents } = require('./socketHandlers');

const app = express();
const port = process.env.PORT || 1337;

// Configura o servidor HTTP com o Express
const server = http.createServer(app);

// Configura o WebSocket
const wss = new WebSocket.Server({ server });

// Servir cliente web estático
app.use(express.static(path.join(__dirname, '../client')));

// Manipula as conexões WebSocket
wss.on('connection', (ws) => {
    handleSocketEvents(ws, wss, port);
});

app.get('/download/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../files', fileName);

    // Confere se o arquivo existe e o serve ao cliente
    res.download(filePath, fileName, (err) => {
        if (err) {
            console.log(`Erro ao enviar o arquivo: ${err.message}`);
            res.status(500).send('Erro ao enviar o arquivo.');
        }
    });
});

// Inicia o servidor
server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
