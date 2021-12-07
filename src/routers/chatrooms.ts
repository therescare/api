import { Router } from 'express';
import { nanoid } from 'nanoid';

const router = Router();

const predefinedRooms = {
	anime: {
		name: 'Anime',
		description: 'Chat about your favourite anime and other things'
	}
};

const privateRooms: Record<string, { name: string; description: string; host: string }> = {};

const users: Record<string, number> = {};

router.get('/', async (req, res) => {
	const asArray = Object.keys(predefinedRooms).map((key) => {
		return {
			name: predefinedRooms[key].name,
			description: predefinedRooms[key].description,
			slug: key,
			userCount: users[key] ?? 0
		};
	});

	res.json({
		users: users.global ?? 0,
		rooms: asArray
	});
});

router.get('/:slug', async (req, res) => {
	const room = predefinedRooms[req.params.slug] ?? privateRooms[req.params.slug];

	if (!room) return res.status(404).json({ error: 'Room not found' });

	res.json({
		name: room.name,
		description: room.description,
		users: users[req.params.slug] ?? 0
	});
});

router.put('/', async (req, res) => {
	const { name, description } = req.body;

	const id = nanoid();
	privateRooms[id] = { name, description: description || 'A private room!', host: null };

    setTimeout(() => {
        if (privateRooms[id] && !privateRooms[id].host) {
            delete privateRooms[id];
            console.log('culled private room', id);
        }
    }, 60000);

	res.json({
		id
	});
});

export default router;
export { users, predefinedRooms, privateRooms };
