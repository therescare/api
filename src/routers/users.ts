import { NextFunction, Request, Response, Router } from 'express';
import { nanoid } from 'nanoid';
import nodemailer from 'nodemailer';

import fs from 'fs';

import { PendingVerification } from '../entities/pendingVerification';
import { User } from '../entities/user';
import { createUser, generateMoniker, verifyJWT } from '../auth';
import dayjs from 'dayjs';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			user: User;
		}
	}
}

const router = Router();

const emailTransporter = nodemailer.createTransport({
	host: process.env.MAIL_HOST,
	port: parseInt(process.env.MAIL_PORT),
	secure: process.env.MAIL_SECURE === 'true',
	auth: {
		user: process.env.MAIL_USERNAME,
		pass: process.env.MAIL_PASSWORD
	}
});

const emailTemplates = {
	verify: fs.readFileSync('./emailTemplates/verify.html', 'utf8')
};

router.post('/', async (req, res) => {
	const { email } = req.body;

	if (!email) return res.status(400).json({ error: 'E-mail is required' });

	const [possibleUser, possibleVerification] = await Promise.all([
		User.findOne({ email }),
		PendingVerification.findOne({ email })
	]);

	if (possibleUser || possibleVerification) {
		return res.status(204).send(); // don't return an error, we want to hide the existence of the user
	}

	const verification = new PendingVerification();
	verification.id = nanoid();
	verification.email = email;
	try {
		await verification.save();
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: 'Failed to create verification information' });
	}

	try {
		await emailTransporter.sendMail({
			from: '"there\'s care." <no-reply@theres.care>',
			to: email,
			subject: 'E-mail Verification',
			html: emailTemplates.verify.replace(/%code%/g, verification.id)
		});
	} catch (e) {
		console.error(e);
		return res.status(500).send();
	}

	res.status(204).send();
});

router.get('/verify/:code', async (req, res) => {
	const possibleVerification = await PendingVerification.findOne({ id: req.params.code });
	if (!possibleVerification) {
		return res.status(404).send();
	}

	return res.status(200).json({ email: possibleVerification.email });
});

router.post('/create', async (req, res) => {
	const { verificationCode, email, password } = req.body;

	const possibleVerification = await PendingVerification.findOne({ id: verificationCode });
	if (!possibleVerification) {
		return res.status(404).json({ error: 'Verification code not found' });
	}

	if (possibleVerification.email !== email) {
		return res.status(400).json({ error: 'Verification code is for different e-mail' });
	}

	try {
		const user = await createUser(email, password);
		delete user.passwordHash;
		return res.json(user);
	} catch (e) {
		return res.status(500).json({ error: e });
	}
});

async function authenticate(req: Request, res: Response, next: NextFunction) {
	if (!req.headers.authorization) return res.status(400).json({ error: 'No token provided' });

	const user = await verifyJWT(req.headers.authorization);
	if (!user) return res.status(403).json({ error: 'Invalid token' });

	req.user = user;

	next();
}

router.get('/me', authenticate, async (req, res) => {
	delete req.user.passwordHash;
	res.json(req.user);
});

router.delete('/', authenticate, async (req, res) => {
	await User.delete({ id: req.user.id });
	res.status(204).send();
})

router.post('/moniker', authenticate, async (req, res) => {
	if (dayjs().isBefore(req.user.canChangeMonikerAfter)) {
		return res
			.status(403)
			.json({ error: 'Cannot change moniker yet', canChangeAfter: req.user.canChangeMonikerAfter });
	}

	req.user.moniker = generateMoniker();
	req.user.canChangeMonikerAfter = dayjs().add(7, 'days').toDate();
	await req.user.save();

	res.json({ moniker: req.user.moniker });
});

export default router;
