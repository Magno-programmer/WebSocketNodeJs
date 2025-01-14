const fs = require('fs');
const path = require('path');

// Armazena nomes dos clientes
const clients = new Map();

function handleSocketEvents(ws, wss, port) {
    ws.on('message', (messageBuffer) => {
        var message = messageBuffer.toString();
        const clientInfo = clients.get(ws) || { name: `Cliente_${clients.size + 1}` };

        // Definir nome do cliente
        if (message.startsWith('/name ')) {
            const newName = message.replace('/name ', '').trim();
            clients.set(ws, { name: newName });
            ws.send(`Nome definido como: ${newName}`);
            console.log(`Cliente ${newName} conectado`);
            return;
        }

        // Enviar mensagem para todos os clientes
        if (message.startsWith('/broadcast ')) {
            const broadcastMessage = message.replace('/broadcast ', '');
            wss.clients.forEach((client) => {
                const targetClient = clients.get(client);
                if (client.readyState === ws.readyState) {
                    if (clientInfo.name !== targetClient.name)
                        client.send(`${clientInfo.name}: ${broadcastMessage}`);
                    else {
                        client.send(`you: ${broadcastMessage}`);

                    }
                } 
            });
            return;
        }

        // Enviar mensagem para cliente específico
        if (message.startsWith('/direct ')) {
            const [_, targetName, directMessage] = message.split(' ', 3);
            wss.clients.forEach((client) => {
                const targetClient = clients.get(client);
                if ((targetClient && targetClient.name === targetName && client.readyState === ws.readyState)) {
                        client.send(`Mensagem direta de ${clientInfo.name}: ${directMessage}`);
                } else if (targetClient.name === clientInfo.name) {
                    client.send(`Você enviou uma mensagem direta para ${targetName}: ${directMessage}`);

                }
            });
            return;
        }

        if (message == '/getmessage') {
            if (ws.readyState === 1) {
                ws.send(`Mensagem do Servidor: O Servidor está funcionando normalmente`);
                console.log(`Mensagem enviada para o cliente ${clientInfo.name}`);

            }
        }

        // Enviar link para download do arquivo para o cliente solicitante
        if (message === '/getfile') {
            const fileName = 'sampleFile.txt'; // Nome do arquivo
            const downloadLink = `http://localhost:${port}/download/${fileName}`;
            ws.send(`Link para download do arquivo: <a href="${downloadLink}" target="_blank">clique aqui</a>`);
            console.log(`Link de download enviado para o cliente ${clientInfo.name}`);
            return;
        }

        // Receber arquivo do cliente
        if (message.startsWith('/sendfile ')) {
            const [_, base64File] = message.split(' ', 2);
            const fileBuffer = Buffer.from(base64File, 'base64');
            fs.writeFile(path.join(__dirname, '../files/uploadedFile.txt'), fileBuffer, (err) => {
                if (err) {
                    ws.send(`Erro ao salvar o arquivo: ${err.message}`);
                    console.log(`Erro ao salvar o arquivo do cliente ${clientInfo.name}: ${err.message}`)
                } else {
                    ws.send('Arquivo recebido e salvo no servidor');
                    console.log(`Arquivo do cliente ${clientInfo.name} recebido e salvo no servidor`)
                }
            });
            return;
        }

        // Solicitar mensagem do servidor
        if (message === '/request') {
            ws.send(`Mensagem do servidor para ${clientInfo.name}: Esta é uma mensagem personalizada do servidor.`);
            return;
        }
    });

    ws.on('close', () => {
        console.log(`Cliente ${clients.get(ws)?.name} desconectado`);
        clients.delete(ws);
    });
}

module.exports = { handleSocketEvents };
