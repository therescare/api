import * as SocketIO from 'socket.io';
import { users, predefinedRooms, privateRooms } from './routers/chatrooms';

import type http from 'http';
import { verifyJWT } from './auth';

function systemMessage(socket: SocketIO.Socket, room: string, message: string) {
	socket.emit('system message', message);
	socket.to(room).emit('system message', message);
}

export default function bind(server: http.Server) {
	const io = new SocketIO.Server(server, {
		cors: {
			origin: ['http://localhost:3000', 'https://theres.care', 'https://staging.theres.care']
		}
	});

	io.use(async (socket, next) => {
		const token = socket.handshake.auth.token;

		if (!token) return next(new Error('No token provided'));
		if (typeof token !== 'string') return next(new Error('Invalid token type'));

		const user = await verifyJWT(token);
		if (!user) return next(new Error('Invalid token'));

		socket.data.user = user;
		next();
	});

	io.on('connection', async (socket) => {
		socket.on('message', (message) => {
			if (!message) return;

			const msg = {
				author: socket.data.user.moniker,
				text: message
			};
			socket.emit('message', msg);
			socket.to(socket.data.chatroom).emit('message', msg);
		});

		socket.on('join room', (slug) => {
			if (socket.data.chatroom) return; // don't allow joining multiple rooms
			if (!slug) socket.disconnect();
			if (![...Object.keys(predefinedRooms), ...Object.keys(privateRooms)].includes(slug))
				return socket.disconnect(); // invalid room

			socket.data.chatroom = slug;
			console.log(socket.id, socket.data.user.moniker, '->', slug);
			socket.join(slug);
			systemMessage(socket, slug, `User joined: ${socket.data.user.moniker}`);

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
			if (!socket.data.chatroom) return; // they never connected to a room

			systemMessage(socket, socket.data.chatroom, `User left: ${socket.data.user.moniker}`);

			if (
				socket.data.chatroom in privateRooms &&
				privateRooms[socket.data.chatroom].host === socket.id
			) {
				console.log('destroying', socket.data.chatroom);
				const sockets = await io.sockets.in(socket.data.chatroom).fetchSockets();
				for (const socket of sockets) {
					socket.emit(
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

	return io;
}
