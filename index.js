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

// تخزين بيانات التذاكر النشطة مؤقتاً للوجات والتقييم
const activeTickets = new Map();

client.once('clientReady', () => {
    console.log(`[✔] تم تسجيل الدخول بنجاح باسم ${client.user.tag}`);
});

// أمر إرسال بانل التذاكر الاحترافي باللون الأحمر اللامع
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!ticket') {
        const embed = new EmbedBuilder()
            .setTitle('🚨 مركز الدعم الفني والشكاوى الرسمي 🚨')
            .setDescription('**أهلاً بك عزيزي العضو في نظام التذاكر المتطور.**\n\nنحن هنا لمساعدتك وحل جميع مشاكلكم واسترعاء انتباه الإدارة بأقصى سرعة واحترافية ممكنة.\n\n> 📌 **يرجى اختيار القسم المناسب بعناية تامة من الأزرار أدناه لفتح تذكرة جديدة:**\n> • **استفسارات عامة:** للإجابة عن أسئلتك العامة.\n> • **التواصل مع الإدارة:** لأمور الشراكات والتقديمات والإدارة.\n> • **ضد إداري:** لتقديم شكوى رسمية بحق أي إداري.\n\n⚠️ *تحذير: فتح تذاكر وهمية او عبثية يعرضك للعقوبات داخل السيرفر.*')
            .setColor('#ff0033') // أحمر لامع وقوي
            .setImage('https://i.imgur.com/43F44UA.png') // صورة جمالية اختيارية أو يمكن حذفها
            .setFooter({ text: 'Jaber Tickets System • All Rights Reserved 2026', iconURL: message.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_inquiries')
                .setLabel('استفسارات عامة')
                .setStyle(ButtonStyle.Success), // أخضر

            new ButtonBuilder()
                .setCustomId('ticket_admin')
                .setLabel('التواصل مع الإدارة')
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
        if (interaction.customId === 'ticket_inquiries') ticketType = 'Inquiries';
        else if (interaction.customId === 'ticket_admin') ticketType = 'Admin Contact';
        else if (interaction.customId === 'ticket_against') ticketType = 'Against Admin';

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

        // مرحلة طلب التقييم عند الضغط على إغلاق التذكرة
        if (interaction.customId === 'close_ticket') {
            const ratingMenu = new StringSelectMenuBuilder()
                .setCustomId('rate_admin')
                .setPlaceholder('⭐ اختر تقييمك لأداء الإداري هنا...')
                .addOptions([
                    { label: '⭐⭐⭐⭐⭐ - ممتاز جداً (5 نجوم)', value: '5_stars' },
                    { label: '⭐⭐⭐⭐ - جيد جداً (4 نجوم)', value: '4_stars' },
                    { label: '⭐⭐⭐ - جيد (3 نجوم)', value: '3_stars' },
                    { label: '⭐⭐ - مقبولة (نجمتان)', value: '2_stars' },
                    { label: '⭐ - سيء (نجمة واحدة)', value: '1_star' }
                ]);

            const row = new ActionRowBuilder().addComponents(ratingMenu);
            await interaction.reply({ content: '🌟 **شكراً لاستخدامك نظام التذاكر.** نرجو تقييم الخدمة المقدمة من الإداري قبل إغلاق الغرفة نهائياً:', components: [row], ephemeral: true });
        }
    }

    // استقبال البيانات من الـ Modal وإنشاء التذكرة داخل الكاتجوري المخصص
    if (interaction.isModalSubmit()) {
        let type = interaction.customId.replace('modal_', '');
        const name = interaction.fields.getTextInputValue('ticket_name');
        const age = interaction.fields.getTextInputValue('ticket_age');
        const reason = interaction.fields.getTextInputValue('ticket_reason');

        await interaction.reply({ content: '⏳ جاري إنشاء تذكرتك وتوجيهك للقسم المختص...', ephemeral: true });

        const guild = interaction.guild;
        const currentTicketNumber = ticketCounter++;
        const channelName = `𝕋𝕚𝕔𝕜𝕖𝕥𝕤-${currentTicketNumber}`;

        // تحديد الـ Category ID حسب القسم المطلوب
        let targetCategoryId = null;
        if (type === 'Inquiries') targetCategoryId = '1564261286043197581';
        else if (type === 'Admin Contact') targetCategoryId = '1564260810883076186';
        else if (type === 'Against Admin') targetCategoryId = '1564259634531930236';

        const channelOptions = {
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

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 تفاصيل تذكرة جديدة (#${currentTicketNumber})`)
            .setDescription(`مرحباً بك <@${interaction.user.id}> في قسم **${type}**.\nلقد تم تسجيل بياناتك بنجاح وسيتولى الفريق المختص متابعة مشكلتك قريباً.`)
            .addFields(
                { name: '👤 الاسم:', value: name, inline: true },
                { name: '📅 العمر:', value: age, inline: true },
                { name: '📝 سبب فتح التذكرة:', value: reason, inline: false }
            )
            .setColor('#ff0055')
            .setTimestamp();

        const sentMessage = await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [closeRow] });

        // حفظ بيانات التذكرة النشطة للوجات والتقييم لاحقاً
        activeTickets.set(channel.id, {
            user: interaction.user,
            ticketNumber: currentTicketNumber,
            type: type,
            name: name,
            age: age,
            reason: reason,
            embed: ticketEmbed
        });

        // إرسال اللوج الأصلي والمطابق في روم الـ logs مع منشن صاحب التذكرة
        const logsChannel = guild.channels.cache.find(c => c.name === 'ticket-logs');
        if (logsChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle('📂 [فتح تذكرة جديدة]')
                .setDescription(`تم فتح تذكرة جديدة بواسطة العضو: <@${interaction.user.id}>`)
                .addFields(
                    { name: 'صاحب التذكرة:', value: `${interaction.user.tag}`, inline: true },
                    { name: 'رقم التذكرة:', value: `#${currentTicketNumber}`, inline: true },
                    { name: 'القسم:', value: type, inline: true },
                    { name: 'الاسم:', value: name, inline: true },
                    { name: 'العمر:', value: age, inline: true },
                    { name: 'السبب:', value: reason, inline: false }
                )
                .setColor('#00ffcc')
                .setTimestamp();
            await logsChannel.send({ embeds: [logEmbed] });
        }
    }

    // استقبال تقييم الإداري وإتمام الإغلاق والحذف مع اللوج النهائي
    if (interaction.isStringSelectMenu() && interaction.customId === 'rate_admin') {
        const rating = interaction.values[0];
        const ticketData = activeTickets.get(interaction.channel.id);
        const guild = interaction.guild;

        await interaction.update({ content: `✅ **شكراً لك! تم تسجيل تقييمك بنجاح (${rating}). جاري حذف الغرفة وكتابة السجلات...**`, components: [] });

        const logsChannel = guild.channels.cache.find(c => c.name === 'ticket-logs');
        if (logsChannel && ticketData) {
            const closeLogEmbed = new EmbedBuilder()
                .setTitle('🔒 [إغلاق تذكرة وتقييم]')
                .setDescription(`تم إغلاق التذكرة بواسطة الإداري: <@${interaction.user.id}>`)
                .addFields(
                    { name: 'صاحب التذكرة الأصلي:', value: `<@${ticketData.user.id}>`, inline: true },
                    { name: 'الإداري المستلم/المغلق:', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'رقم التذكرة:', value: `#${ticketData.ticketNumber}`, inline: true },
                    { name: 'القسم:', value: ticketData.type, inline: true },
                    { name: 'التقييم المستلم:', value: rating, inline: true }
                )
                .setColor('#ff0000')
                .setTimestamp();

            await logsChannel.send({ embeds: [closeLogEmbed] });
        }

        activeTickets.delete(interaction.channel.id);

        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 4000);
    }
});

client.login(config.token);
            
