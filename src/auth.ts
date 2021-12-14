import argon2, { argon2id } from 'argon2';
import { uniqueNamesGenerator, colors, names } from 'unique-names-generator';
import jwt from 'jsonwebtoken';

import os from 'os';

import { User } from './entities/user';
import dayjs from 'dayjs';

const hashingOptions = {
	type: argon2id,
	parallelism: os.cpus().length * 2
};

const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function hash(password: string) {
	return argon2.hash(password, hashingOptions);
}

export function generateMoniker() {
	return uniqueNamesGenerator({
		dictionaries: [colors, names, numbers, numbers],
		separator: '',
		length: 4
	});
}

export async function createUser(email: string, password: string) {
	const passwordHash = await hash(password);

	const user = new User();
	user.email = email;
	user.passwordHash = passwordHash;
	user.moniker = generateMoniker();
	user.canChangeMonikerAfter = dayjs().add(7, 'days').toDate();
	return user.save();
}

export async function authenticate(email: string, password: string) {
	const user = await User.findOne({ email });
	if (!user) return null;

	if (await argon2.verify(user.passwordHash, password)) {
		if (argon2.needsRehash(password, hashingOptions)) {
			// in case hashing configuration changes
			const passwordHash = await hash(password);
			user.passwordHash = passwordHash;
			await user.save();
		}

		return user;
	} else {
		return null;
	}
}

export async function createJWT(email: string) {
	const user = await User.findOneOrFail({ email });

	const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
	return token;
}

export async function verifyJWT(token: string) {
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET) as { email: string };

		const user = await User.findOneOrFail({ email: decoded.email });
		return user;
	} catch {
		return null;
	}
}

export async function refreshMoniker(email: string) {
	const user = await User.findOneOrFail({ email });

	user.moniker = generateMoniker();
	user.canChangeMonikerAfter = dayjs().add(7, 'days').toDate();
	await user.save();

	return user.moniker;
}
