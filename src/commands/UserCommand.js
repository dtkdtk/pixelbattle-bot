const PixelCommand = require('../structures/PixelCommand');
const { EmbedBuilder } = require('discord.js');

function buildRole(id, permissions) {
    if(permissions.special.includes(id)) return 'специальная';
    else if(permissions.admin.includes(id)) return 'администратор';
    else if(permissions.moderator.includes(id)) return 'модератор';
    else return 'игрок';
}

class UserCommand extends PixelCommand {
    constructor() {
        super('user', {
            cooldown: 3,
            aliases: ['player', 'info', 'u'],
        });
    }

    async run(message, args) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const msg = await message.reply({ content: 'Производится сбор данных о игроке...' });

        const information = await message.client.database.collection('users')
            .findOne({ userID: member.id }, { projection: { _id: 0, token: 1, tag: 1, points: 1, badges: 1, banned: 1 } });

        return msg.edit({
            content: null,
            embeds: [
                new EmbedBuilder()
                .setTitle((member.id === message.author.id) ? 'Информация о вас' : `Информация о ${member.nickname || member.user.username}`)
                .setColor(0x5865F2)
                .addFields([
                    { 
                        name: '📌 Основная информация',
                        value: 
                            `> ID участника: \`${member.id}\`\n` +
                            `> Тег участника: \`${member.user.tag}\`\n` +
                            `> Ник участника: \`${member.nickname || 'отсутсвует'}\`\n` +
                            `> Дата регистрации: <t:${Math.ceil(member.user.createdTimestamp / 1000)}>\n` +
                            `> Дата захода на сервер: <t:${Math.ceil(member.joinedTimestamp / 1000)}>`
                    },
                    {
                        name: '🛠️ Внутреняя информация',
                        value: 
                            `> Первая авторизация: ${!information?.token ? '**не производилась**' : `<t:${Math.ceil(parseInt(information.token.split('.')[2], 36) / 1000)}>`}\n` +
                            `> Значки: ${message.client.functions.buildBadges(information?.badges ?? []) ?? '**отсутствуют**'}\n` +
                            `> Тег: **${information?.tag || 'отсутствует'}**\n` +
                            `> Блокировка: ${information.banned ? `✅ (действует до: <t:${Math.floor(information.banned.timeout / 1000)}>)` : '❌'}\n` +
                            `> Роль: \`${buildRole(member.id, message.client.permissions)}\`\n` +
                            `> Баллы: **${information?.points || 0}**`
                    }
                ])
                .setThumbnail(member.user.displayAvatarURL())
            ]
        });
    }
}

module.exports = UserCommand;