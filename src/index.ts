import http from 'http';

import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';

import Express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as TypeORM from 'typeorm';

import chatroomsRouter from './routers/chatrooms';
import usersRouter from './routers/users';

const app = Express();
const server = http.createServer(app);

app.use(bodyParser.json());

app.use(
	cors({
		origin: ['http://localhost:3000', 'https://theres.care', 'https://staging.theres.care']
	})
);

app.get('/', async (_, res) => res.json({ message: 'Hello World!' }));
app.use('/chatrooms', chatroomsRouter);
app.use('/users/', usersRouter);

(async () => {
	await TypeORM.createConnection();
	server.listen(process.env.PORT, () => console.log('ok'));
})();
