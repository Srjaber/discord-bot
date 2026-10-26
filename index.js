const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// متغير لعداد أرقام التذاكر
let ticketCounter = 1;

client.once('clientReady', () => {
    console.log(`[✔] تم تسجيل الدخول بنجاح باسم ${client.user.tag}`);
});

// أمر إرسال بانل التذاكر
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!ticket') {
        const embed = new EmbedBuilder()
            .setTitle('🎫 نظام تذاكر الدعم الفني والشكاوى')
            .setDescription('**أهلاً بك عزيزي العضو في مركز الدعم الفني.**\n\nيرجى اختيار القسم المناسب أدناه لفتح تذكرة جديدة وسيقوم فريق الإدارة بالاستجابة لطلبك في أسرع وقت ممكن.\n\n*يرجى الالتزام بقوانين السيرفر وعدم فتح تذاكر عبثية.*')
            .setColor('#ff0055') // لون نيون مميز وجذاب للوصف
            .setFooter({ text: 'Jaber Tickets System • Secure Support' });

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

// التعامل مع الأزرار وإظهار نموذج إدخال البيانات (Modal)
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        let ticketType = '';
        if (interaction.customId === 'ticket_inquiries') ticketType = 'inquiries';
        else if (interaction.customId === 'ticket_admin') ticketType = 'admin-contact';
        else if (interaction.customId === 'ticket_against') ticketType = 'against-admin';

        if (ticketType) {
            const modal = new ModalBuilder()
                .setCustomId(`modal_${ticketType}`)
                .setTitle('نموذج تقديم معلومات التذكرة');

            const nameInput = new TextInputBuilder()
                .setCustomId('ticket_name')
                .setLabel('الاسم ثلاثي أو المستعار')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const ageInput = new TextInputBuilder()
                .setCustomId('ticket_age')
                .setLabel('العمر')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const reasonInput = new TextInputBuilder()
                .setCustomId('ticket_reason')
                .setLabel('سبب فتح التذكرة بالتفصيل')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(ageInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );

            await interaction.showModal(modal);
        }

        // زر إغلاق التذكرة
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 جاري إغلاق التذكرة وحذف الغرفة خلال 5 ثوانٍ...', ephemeral: true });
            
            // إرسال لوج الإغلاق
            const logsChannel = interaction.guild.channels.cache.find(c => c.name === 'ticket-logs');
            if (logsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🔒 إغلاق تذكرة')
                    .setDescription(`تم إغلاق التذكرة بواسطة: ${interaction.user.tag}`)
                    .setColor('#ff0000')
                    .setTimestamp();
                await logsChannel.send({ embeds: [logEmbed] });
            }

            setTimeout(async () => {
                await interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }

    // استقبال البيانات من الـ Modal وإنشاء التذكرة بالاسم المطلوب 𝕋𝕚𝕔𝕜𝕖𝕥𝕤
    if (interaction.isModalSubmit()) {
        let type = interaction.customId.replace('modal_', '');
        const name = interaction.fields.getTextInputValue('ticket_name');
        const age = interaction.fields.getTextInputValue('ticket_age');
        const reason = interaction.fields.getTextInputValue('ticket_reason');

        await interaction.reply({ content: '⏳ جاري إنشاء تذكرتك وتجهيز الغرفة...', ephemeral: true });

        const guild = interaction.guild;
        const currentTicketNumber = ticketCounter++;
        const channelName = `𝕋𝕚𝕔𝕜𝕖𝕥𝕤-${currentTicketNumber}`;

        const channel = await guild.channels.create({
            name: channelName,
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
                .setLabel('إغلاق التذكرة 🔒')
                .setStyle(ButtonStyle.Danger)
        );

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 تفاصيل تذكرة جديدة (#${currentTicketNumber})`)
            .setDescription(`مرحباً بك <@${interaction.user.id}> في قسم **${type}**.\nلقد تم تسجيل بياناتك بنجاح وسيتولى الفريق متابعة مشكلتك.`)
            .addFields(
                { name: '👤 الاسم:', value: name, inline: true },
                { name: '📅 العمر:', value: age, inline: true },
                { name: '📝 سبب فتح التذكرة:', value: reason, inline: false }
            )
            .setColor('#00ffcc')
            .setTimestamp();

        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [closeRow] });

        // إرسال اللوج في روم الـ logs إن وجد
        const logsChannel = guild.channels.cache.find(c => c.name === 'ticket-logs');
        if (logsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('📂 فتح تذكرة جديدة')
                .addFields(
                    { name: 'صاحب التذكرة:', value: `${interaction.user.tag}`, inline: true },
                    { name: 'رقم التذكرة:', value: `#${currentTicketNumber}`, inline: true },
                    { name: 'القسم:', value: type, inline: true },
                    { name: 'الاسم:', value: name, inline: true },
                    { name: 'العمر:', value: age, inline: true },
                    { name: 'السبب:', value: reason, inline: false }
                )
                .setColor('#0099ff')
                .setTimestamp();
            await logsChannel.send({ embeds: [logEmbed] });
        }
    }
});

client.login(config.token);
