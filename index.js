const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType,
    ComponentType
} = require('discord.js');

const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// تعريف الألوان (Hex Colors)
const COLORS = {
    NEON_GREEN: 0x39FF14, // أخضر لامع (للإستفسارات والوصف الرئيسي)
    NEON_RED: 0xFF007F,   // أحمر/وردي لامع (للتواصل مع الأدمن)
    NEON_GRAY: 0x808080   // رصاصي لامع (بلاغ ضد إداري)
};

client.once('ready', async () => {
    console.log(`✅ تم تشغيل البوت بنجاح: ${client.user.tag}`);

    // تسجيل أمر Slash Command /setup
    const guild = client.guilds.cache.get(config.guildId);
    if (guild) {
        await guild.commands.set([
            {
                name: 'setup-ticket',
                description: 'إرسال بنل تذاكر الدعم والشكاوى'
            }
        ]);
    }
});

// التعامل مع أوامر Slash Commands
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup-ticket') {
            // إمبد الوصف الرئيسي للبوت (باللون الأخضر اللامع)
            const embed = new EmbedBuilder()
                .setTitle('🔰 مركز الدعم والشكاوى')
                .setDescription('مرحباً بك في نظام الدعم الفني! يرجى اختيار الفئة المناسبة لطلبك من القائمة أدناه ليتم فتح تذكرة خاصة بك.')
                .setColor(COLORS.NEON_GREEN)
                .setFooter({ text: 'نظام الشكاوى والدعم الفني', iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            // قائمة الاختيارات الفئات
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_category_select')
                .setPlaceholder('إختر فئة التذكرة المناسبة...')
                .addOptions([
                    {
                        label: 'قسم الاستفسارات العامة',
                        description: 'استفسارات وأسئلة عامة حول السيرفر',
                        value: 'inquiries',
                        emoji: '❓'
                    },
                    {
                        label: 'التواصل مع الأدمن',
                        description: 'مساعدة مباشرة وخاصة من إدارة السيرفر',
                        value: 'admin',
                        emoji: '👑'
                    },
                    {
                        label: 'بلاغ ضد إداري',
                        description: 'تقديم شكوى خاصة ومباشرة ضد أحد أفراد الإدارة',
                        value: 'againstAdmin',
                        emoji: '⚠️'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    // التعامل مع اختيار الفئة من Select Menu
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
        const categoryType = interaction.values[0];
        const user = interaction.user;

        let embedColor;
        let categoryTitle;
        let categoryId;

        switch (categoryType) {
            case 'inquiries':
                embedColor = COLORS.NEON_GREEN; // أخضر لامع
                categoryTitle = '🟢 تذكرة استفسارات';
                categoryId = config.categories.inquiries;
                break;
            case 'admin':
                embedColor = COLORS.NEON_RED; // أحمر لامع
                categoryTitle = '🔴 تذكرة تواصل مع الأدمن';
                categoryId = config.categories.admin;
                break;
            case 'againstAdmin':
                embedColor = COLORS.NEON_GRAY; // رصاصي لامع
                categoryTitle = '⚪ تذكرة ضد إداري';
                categoryId = config.categories.againstAdmin;
                break;
        }

        // تحديد القناة المستهدفة لإنشاء الثريد فيها (إما الكاتجوري المخصص أو القناة الحالية)
        let targetChannel = interaction.channel;
        if (categoryId) {
            const fetchedCategory = interaction.guild.channels.cache.get(categoryId);
            if (fetchedCategory && fetchedCategory.type === ChannelType.GuildText) {
                targetChannel = fetchedCategory;
            }
        }

        // إنشاء Thread مخصص للتذكرة
        try {
            const thread = await targetChannel.threads.create({
                name: `${user.username}-${categoryType}`,
                autoArchiveDuration: 1440, // أرشفة بعد 24 ساعة من الخمول
                type: ChannelType.PrivateThread, // ثريد خاص
                reason: `تذكرة جديدة بواسطة ${user.tag}`
            });

            // إضافة صاحب التذكرة للثريد
            await thread.members.add(user.id);

            // رسالة إمبد داخل الثريد
            const ticketEmbed = new EmbedBuilder()
                .setTitle(categoryTitle)
                .setDescription(`أهلاً بك <@${user.id}>!\nتم فتح التذكرة بنجاح. يرجى كتابة تفاصيل طلبك أو شكواك هنا وسيقوم الفريق المختص بالرد عليك في أقرب وقت.`)
                .setColor(embedColor)
                .setTimestamp();

            // زر إغلاق التذكرة
            const closeBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق التذكرة')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            await thread.send({ content: `<@${user.id}>`, embeds: [ticketEmbed], components: [closeBtn] });

            await interaction.reply({ content: `✅ تم إنشاء تذكرتك بنجاح: ${thread}`, ephemeral: true });

        } catch (error) {
            console.error('خطأ أثناء إنشاء الثريد:', error);
            await interaction.reply({ content: '❌ حدث خطأ أثناء إنشاء التذكرة، تأكد من صلاحيات البوت!', ephemeral: true });
        }
    }

    // التعامل مع زر إغلاق التذكرة
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        if (interaction.channel.isThread()) {
            await interaction.reply('🔒 سيتم إغلاق وحذف التذكرة خلال 5 ثوانٍ...');
            setTimeout(async () => {
                await interaction.channel.delete();
            }, 5000);
        }
    }
});

client.login(config.token);

