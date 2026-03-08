const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Send list of channels to the website when it loads
    socket.on('getChannels', () => {
        const channels = client.channels.cache
            .filter(c => c.type === 0) // Only text channels
            .map(c => ({ id: c.id, name: c.name }));
        socket.emit('channelList', channels);
    });

    socket.on('sendMessage', async (data) => {
        try {
            const channel = await client.channels.fetch(data.channelId);
            if (channel) await channel.send(data.content);
        } catch (err) { console.error(err); }
    });
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    io.emit('discordMessage', {
        author: message.author.username,
        content: message.content,
        channel: message.channel.name
    });
});

client.login(process.env.TOKEN); // Set this in Replit Secrets
server.listen(3000, () => console.log('Web Dashboard is online!'));
