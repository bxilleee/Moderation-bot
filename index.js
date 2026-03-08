const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Serve the dashboard
app.use(express.static('public'));

// Real-time communication
io.on('connection', (socket) => {
    console.log('User connected to dashboard');

    // Handle sending messages from the website
    socket.on('sendMessage', async (data) => {
        try {
            const channel = await client.channels.fetch(data.channelId);
            if (channel) {
                await channel.send(data.content);
            }
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    });
});

// Pipe Discord messages to the website tab
client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    io.emit('discordMessage', {
        author: message.author.username,
        content: message.content,
        channel: message.channel.name
    });
});

client.login('YOUR_BOT_TOKEN_HERE');
server.listen(3000, () => console.log('Dashboard live on port 3000'));
