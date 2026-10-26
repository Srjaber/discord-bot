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

let ticketCounter = 1;
const activeTickets = new Map();

// ID الرول التلقائي للجميع والجدد
const AUTO_ROLE_ID = '1564303060623167568';

client.once('clientReady', () => {
    console.log(`[✔] تم تسجيل الدخول بنجاح باسم ${client.user.tag}`);
});

// 1. منح الرول التلقائي للأعضاء والترحيب
client.on('guildMemberAdd', async member => {
    try {
        // إعطاء الرول التلقائي بالأيدي
        const autoRole = member.guild.roles.cache.get(AUTO_ROLE_ID);
        if (autoRole) {
            await member.roles.add(autoRole).catch(console.error);
        }

        // إرسال رسالة الترحيب
        const welcomeChannelId = '1484482042040156272';
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

        if (welcomeChannel) {
            const userAvatar = member.user.displayAvatarURL({ dynamic: true, size: 512 });

            const welcomeEmbed = new EmbedBuilder()
                .setTitle('『💲』 𝐃𝐎𝐋𝐋𝑨𝑞 • Welcome to our Family!')
                .setDescription(
                    `أهلاً ومرحباً بك يا مبدع <@${member.id}> في سيرفرنا!\n\n` +
                    `💎 نحن سعداء بانضمامك إلى عائلة **『💲』𝑫𝑶𝑳𝑳𝑨𝑹**.\n` +
                    `✨ نرجو قراءة القوانين والاستمتاع بتجربتك معنا والتوجه لقنوات الطلب والدعم متى أردت ذلك.`
                )
                .setColor('#ff0033')
                .setThumbnail(userAvatar)
                .setImage(userAvatar)
                .setFooter({ text: `Member #${member.guild.memberCount} • Have a nice stay!`, iconURL: member.guild.iconURL() })
                .setTimestamp();

            await welcomeChannel.send({ content: `welcome <@${member.id}> 🎉`, embeds: [welcomeEmbed] });
        }
    } catch (error) {
        console.error('Error in guildMemberAdd:', error);
    }
});

// 2. أمر إنشاء بنل التذاكر
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!ticket') {
        const guildIcon = message.guild.iconURL({ dynamic: true });

        const embed = new EmbedBuilder()
            .setTitle('『💲』 𝐃𝐎𝐋𝐋𝑨𝑹 • Official Support & Design Panel')
            .setDescription(
                '『💲』 **𝑫𝑶𝑳𝑳𝑨𝑹**\n\n' +
                '💎 حيث تلتقي الفخامة بالإبداع، وتتحول التفاصيل إلى لمسات استثنائية من الأناقة والتميز.\n\n' +
                '🖼️ من البنرات الفاخرة وصور البروفايل المميزة، إلى الاستيكرات الإبداعية والتصاميم الحصرية، نهتم بكل تفصيلة لنمنحك هوية متكاملة تعكس ذوقك وشخصيتك.\n\n' +
                '✨ هدفنا أن نجعل كل تصميم يحمل طابعًا خاصًا، وكل استيكر يضيف لمسة من الإبداع، وكل بنر يعكس مستوى مختلفًا من الرقي والفخامة.\n\n' +
                '🖤 **DOLLAR** ليست مجرد تصاميم، بل عالم من الأناقة والإبداع والتميز، حيث تتحدث التفاصيل عن نفسها.\n\n' +
                '🔴 **قسم الإبداع والتميز البصري:**\n' +
                '> *نحن نضمن لك جودة خارقة، وتصاميم تحبس الأنفاس، ودقة لا مثيل لها في كل بكسل لتتألق بين الجميع بلا منازع!*\n\n' +
                '💵 『💲』 **𝑫𝑶𝑳𝑳𝑨𝑹**\n' +
                '`Luxury • Creativity • Excellence • Power`'
            )
            .setColor('#ff0033')
            .setThumbnail(guildIcon)
            .setImage('https://i.imgur.com/43F44UA.png')
            .setFooter({ text: 'Jaber & DOLLAR Systems • All Rights Reserved 2026', iconURL: guildIcon });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_banner')
                .setLabel('طلب بنر')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('ticket_sticker')
                .setLabel('طلب استيكر')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('ticket_support')
                .setLabel('الدعم الفني')
                .setStyle(ButtonStyle.Secondary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// التعامل مع التفاعلات (Buttons, Modals, Select Menus)
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        let ticketType = '';
        if (interaction.customId === 'ticket_banner') ticketType = 'طلب بنر';
        else if (interaction.customId === 'ticket_sticker') ticketType = 'طلب استيكر';
        else if (interaction.customId === 'ticket_support') ticketType = 'الدعم الفني';

        if (ticketType) {
            const modal = new ModalBuilder()
                .setCustomId(`modal_${ticketType}`)
                .setTitle(`نموذج ${ticketType}`);

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
                .setLabel('تفاصيل الطلب أو سبب فتح التذكرة')
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
            const ratingMenu = new StringSelectMenuBuilder()
                .setCustomId('rate_admin')
                .setPlaceholder('⭐ اختر تقييمك لأداء الخدمة والإدارة...')
                .addOptions([
                    { label: '⭐⭐⭐⭐⭐ - ممتاز جداً (5/5)', value: '⭐⭐⭐⭐⭐ (ممتاز جداً)' },
                    { label: '⭐⭐⭐⭐ - جيد جداً (4/5)', value: '⭐⭐⭐⭐ (جيد جداً)' },
                    { label: '⭐⭐⭐ - جيد (3/5)', value: '⭐⭐⭐ (جيد)' },
                    { label: '⭐⭐ - مقبول (2/5)', value: '⭐⭐ (مقبول)' },
                    { label: '⭐ - سيء (1/5)', value: '⭐ (سيء)' }
                ]);

            const row = new ActionRowBuilder().addComponents(ratingMenu);
            await interaction.update({ 
                content: `🔒 **طلب الإغلاق بواسطة:** <@${interaction.user.id}>\n🌟 **الرجاء اختيار تقييم الخدمة أدناه قبل حذف الغرفة:**`, 
                components: [row] 
            });
        }
    }

    // استقبال نموذج التذكرة وإنشائها
    if (interaction.isModalSubmit()) {
        let type = interaction.customId.replace('modal_', '');
        const name = interaction.fields.getTextInputValue('ticket_name');
        const age = interaction.fields.getTextInputValue('ticket_age');
        const reason = interaction.fields.getTextInputValue('ticket_reason');

        await interaction.reply({ content: '⏳ جاري إنشاء تذكرتك وتخصيص الصلاحيات...', ephemeral: true });

        const guild = interaction.guild;
        const currentTicketNumber = ticketCounter++;
        const channelName = `𝕋𝕚𝕔𝕜𝕖𝕥𝕤-${currentTicketNumber}`;

        let targetCategoryId = null;
        let allowedRoles = [];

        // تخصيص الرولات المحددة بدقة لكل فئة
        if (type === 'طلب بنر') {
            targetCategoryId = '1564261286043197581'; 
            allowedRoles = ['1564296776553595001', '1564297728786305024'];
        } 
        else if (type === 'طلب استيكر') {
            targetCategoryId = '1564260810883076186'; 
            allowedRoles = ['1564296776553595001', '1564297864413319279'];
        } 
        else if (type === 'الدعم الفني') {
            targetCategoryId = '1564259634531930236'; 
            allowedRoles = ['1564297994168303646', '1564296776553595001'];
        }

        let permissionOverwrites = [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            },
        ];

        allowedRoles.forEach(roleId => {
            permissionOverwrites.push({
                id: roleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
            });
        });

        const channelOptions = {
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: permissionOverwrites,
        };

        if (targetCategoryId) {
            channelOptions.parent = targetCategoryId;
        }

        const channel = await guild.channels.create(channelOptions);

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('إغلاق التذكرة 🔒')
                .setStyle(ButtonStyle.Danger)
        );

        // إعداد المنشنات (العضو + رولات الفئة)
        const roleMentions = allowedRoles.map(rId => `<@&${rId}>`).join(' ');
        const fullMentionText = `<@${interaction.user.id}> ${roleMentions}`;

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`『💲』 𝐃𝐎𝐋𝐋𝑨𝑹 • تذكرة جديدة (#${currentTicketNumber})`)
            .setDescription(`مرحباً بك <@${interaction.user.id}> في قسم **${type}**.\nلقد تم تسجيل بياناتك بنجاح وسيتولى الفريق المختص متابعة طلبك بأعلى احترافية.`)
            .addFields(
                { name: '👤 الاسم:', value: name, inline: true },
                { name: '📅 العمر:', value: age, inline: true },
                { name: '📝 تفاصيل الطلب:', value: reason, inline: false }
            )
            .setColor('#ff0033')
            .setTimestamp();

        // إرسال الرسالة مع المنشن المتكامل
        await channel.send({ content: fullMentionText, embeds: [ticketEmbed], components: [closeRow] });

        activeTickets.set(channel.id, {
            user: interaction.user,
            ticketNumber: currentTicketNumber,
            type: type,
            name: name,
            age: age,
            reason: reason
        });

        // سجلات اللوج عند الفتح
        const logsChannel = guild.channels.cache.find(c => c.name === 'ticket-logs');
        if (logsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('📂 [فتح تذكرة جديدة]')
                .setDescription(`تم فتح تذكرة جديدة بواسطة العضو: <@${interaction.user.id}>`)
                .addFields(
                    { name: 'صاحب التذكرة', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'رقم التذكرة', value: `#${currentTicketNumber}`, inline: true },
                    { name: 'القسم', value: type, inline: true },
                    { name: 'الاسم', value: name, inline: true },
                    { name: 'العمر', value: age, inline: true },
                    { name: 'السبب', value: reason, inline: false }
                )
                .setColor('#00ffcc')
                .setTimestamp();
            await logsChannel.send({ embeds: [logEmbed] });
        }
    }

    // التقييم الفخم وإغلاق التذكرة
    if (interaction.isStringSelectMenu() && interaction.customId === 'rate_admin') {
        const rating = interaction.values[0];
        const ticketData = activeTickets.get(interaction.channel.id);
        const guild = interaction.guild;

        await interaction.update({ content: `✅ **تم استلام التقييم بنجاح. جاري حفظ السجلات وإغلاق الغرفة...**`, components: [] });

        const logsChannel = guild.channels.cache.find(c => c.name === 'ticket-logs');
        if (logsChannel && ticketData) {
            const closeLogEmbed = new EmbedBuilder()
                .setTitle('🔒 『💲』 𝐃𝐎𝐋𝐋𝑨𝑹 • تقييم وسجل إغلاق التذكرة')
                .setDescription(`تم إغلاق التذكرة بنجاح وتقييم مستوى الخدمة والإدارة.`)
                .addFields(
                    { name: '👤 صاحب التذكرة', value: `<@${ticketData.user.id}>`, inline: true },
                    { name: '🛠️ الإداري المغلق', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '🎫 رقم التذكرة', value: `#${ticketData.ticketNumber}`, inline: true },
                    { name: '📁 القسم', value: ticketData.type, inline: true },
                    { name: '📝 الاسم المسجل', value: ticketData.name, inline: true },
                    { name: '📅 العمر', value: ticketData.age, inline: true },
                    { name: '⭐ تقييم الخدمة', value: `**${rating}**`, inline: true },
                    { name: '💬 تفاصيل الطلب', value: ticketData.reason, inline: false }
                )
                .setColor('#ff0033')
                .setFooter({ text: 'DOLLAR Support System', iconURL: guild.iconURL() })
                .setTimestamp();

            await logsChannel.send({ embeds: [closeLogEmbed] });
        }

        activeTickets.delete(interaction.channel.id);

        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 3000);
    }
});

client.login(config.token);
            
