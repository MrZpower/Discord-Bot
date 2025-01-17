import { client } from "../..";
import { pmdDB } from "../../database/client";
import roles from "../../roles";
import { info } from "../../util/debug";

const betaUserColl = pmdDB.collection("betaUsers"),
	discordUsers = pmdDB.collection("discordUsers");

async function updateDiscordUsers() {
	let guildMembers = await client.guilds.cache
		.get("493130730549805057")
		.members.fetch({ limit: 0 });

	discordUsers.bulkWrite(
		guildMembers.map(user => {
			return {
				updateOne: {
					filter: { userId: user.id },
					update: {
						$set: {
							userId: user.id,
							created: user.user.createdTimestamp,
							username: user.user.username,
							discriminator: user.user.discriminator,
							avatar: user.user.displayAvatarURL()
						}
					},
					upsert: true
				}
			};
		})
	);
}

async function updateBetaUsers() {
	const betaUsers: any = await betaUserColl
		.find({}, { projection: { _id: false } })
		.toArray();

	let guildMembers = (
		await client.guilds.cache
			.get("493130730549805057")
			.members.fetch({ limit: 0 })
	).filter(
		m =>
			(m.roles.cache.has(roles.booster) ||
				betaUsers.find(b => b.userId === m.user.id)) &&
			!m.roles.cache.has(roles.alpha) &&
			!m.roles.cache.has(roles.beta)
	);

	for (let i = 0; i < guildMembers.size; i++)
		await guildMembers.array()[i].roles.add(roles.beta);

	info("Updated beta users.");
}

updateBetaUsers();
updateDiscordUsers();

setInterval(updateBetaUsers, 60 * 1000);
