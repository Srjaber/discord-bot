const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('clientReady', () => {
    console.log(`[✔] تم تسجيل الدخول بنجاح باسم ${client.user.tag}`);
});

// أمر لرسالة التذاكر (يمكنك كتابة !ticket في السيرفر لإرسال القائمة)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!ticket') {
        const embed = new EmbedBuilder()
            .setTitle('🎫 نظام تذاكر الدعم الفني')
            .setDescription('يرجى اختيار القسم المناسب لفتح تذكرة وسيقوم فريق الإدارة بالرد عليك في أقرب وقت.')
            .setColor('#2b2d31')
            .setFooter({ text: 'Jaber Tickets System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_inquiries')
                .setLabel('استفسارات عامة')
                .setStyle(ButtonStyle.Success), // أخضر

            new ButtonBuilder()
                .setCustomId('ticket_admin')
                .setLabel('تواصل مع الإدارة')
                .setStyle(ButtonStyle.Danger), // أحمر

            new ButtonBuilder()
                .setCustomId('ticket_against')
                .setLabel('شكوى ضد إداري')
                .setStyle(ButtonStyle.Secondary) // رمادي
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// نظام إنشاء التذكرة عند الضغط على الأزرار
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    let categoryName = '';
    let ticketType = '';

    if (interaction.customId === 'ticket_inquiries') {
        ticketType = 'inquiries';
        categoryName = '🟢-inquiries';
    } else if (interaction.customId === 'ticket_admin') {
        ticketType = 'admin-contact';
        categoryName = '🔴-admin-contact';
    } else if (interaction.customId === 'ticket_against') {
        ticketType = 'against-admin';
        categoryName = '⚪-against-admin';
    }

    if (ticketType) {
        await interaction.reply({ content: 'جاري إنشاء تذكرتك...', ephemeral: true });

        const guild = interaction.guild;
        const channel = await guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
            ],
        });

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('إغلاق التذكرة')
                .setStyle(ButtonStyle.Danger)
        );

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`تذكرة جديدة: ${ticketType}`)
            .setDescription(`مرحباً ${interaction.user},\nتم فتح هذه التذكرة بواسطة قسم **${ticketType}**.\nيرجى كتابة مشكلتك أو استفسارك وسيقوم المختصون بالرد عليك قريباً.`)
            .setColor('#0099ff');

        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [closeRow] });
    }

    // زر إغلاق التذكرة
    if (interaction.customId === 'close_ticket') {
        await interaction.reply('جاري إغلاق الحذف وحذف الروم خلال 5 ثوانٍ...');
        setTimeout(() => {
            interaction.channel.delete().catch(() => {});
        }, 5000);
    }
});

client.login(config.token);
            
