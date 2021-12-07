import http from 'http';

import dotenv from 'dotenv';
dotenv.config();

import Express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as SocketIO from 'socket.io';

import chatroomsRouter, { users, predefinedRooms, privateRooms } from './routers/chatrooms.js';

const app = Express();
const server = http.createServer(app);
const io = new SocketIO.Server(server, {
	cors: {
		origin: ['http://localhost:3000', 'https://theres.care', 'https://staging.theres.care']
	}
});

app.use(bodyParser.json());

app.use(
	cors({
		origin: ['http://localhost:3000', 'https://theres.care', 'https://staging.theres.care']
	})
);

app.get('/', async (_, res) => res.json({ message: 'Hello World!' }));
app.use('/chatrooms', chatroomsRouter);

function systemMessage(socket: SocketIO.Socket, room: string, message: string) {
	socket.emit('system message', message);
	socket.to(room).emit('system message', message);
}

io.on('connection', async (socket) => {
	socket.on('message', (message) => {
		const msg = {
			author: socket.id,
			text: message
		};
		socket.emit('message', msg);
		socket.to(socket.data.chatroom).emit('message', msg);
	});

	socket.on('join room', (slug) => {
		if (socket.data.chatroom) return; // don't allow joining multiple rooms
		if (!slug) socket.disconnect();
		if (![...Object.keys(predefinedRooms), ...Object.keys(privateRooms)].includes(slug))
			socket.disconnect(); // invalid room

		socket.data.chatroom = slug;
		console.log(socket.id, '->', slug);
		socket.join(slug);
		systemMessage(socket, slug, `User joined: ${socket.id}`);

		if (slug in privateRooms) {
			const room = privateRooms[slug];
			if (!room.host) {
				room.host = socket.id;
				socket.emit(
					'private message',
					'🖥️ System',
					socket.id,
					'Welcome to your private room! You are the host. When you disconnect, this room will be shut down.'
				);
			}
		}

		users[slug] ??= 0;
		users[slug]++;

		users.global ??= 0;
		users.global++;
	});

	socket.on('disconnect', async () => {
		systemMessage(socket, socket.data.chatroom, `User left: ${socket.id}`);

		if (
			socket.data.chatroom in privateRooms &&
			privateRooms[socket.data.chatroom].host === socket.id
		) {
			console.log('destroying', socket.data.chatroom);
			const sockets = await io.sockets.in(socket.data.chatroom).fetchSockets();
			for (const socket of sockets) {
				io.sockets
					.to(socket.data.chatroom)
					.emit(
						'private message',
						'🖥️ System',
						socket.id,
						'The host has disconnected. The room will be shut down.'
					);
				socket.emit('kick', 'This private room is now closed.');
				socket.disconnect();
			}
			delete privateRooms[socket.data.chatroom];
		}

		users.global--;
		users[socket.data.chatroom]--;
	});
});

server.listen(process.env.PORT, () => console.log('ok'));
