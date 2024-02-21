const config = require('./config.json');
const lang = require('./lang.json');
const TelegramBot = require('node-telegram-bot-api');
const firebase = require('firebase');
const bot = new TelegramBot(config.TOKEN, { polling: true });
const firebaseConfig = config.databaseConfig;

const adminChatId = config.adminChat;
const superAdmins = config.admins;
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const chats = database.ref('chats');
const reminder = database.ref('reminder');

const timeToCourseButtons = {
    reply_markup: JSON.stringify({
        keyboard: [
            [lang.timeToCourse.week_15],
            [lang.timeToCourse.week_5],
            [lang.timeToCourse.day_15]
        ]
    })
}


const mainMenuButtons = {
    reply_markup: JSON.stringify({
        keyboard: [
            [lang.menus.mainMenu.lessons, lang.menus.mainMenu.dictionary],
            [lang.menus.mainMenu.information, lang.menus.mainMenu.options]
        ],
        
    })
}


const lessonsMenu = [
    [{ text: lang.callBack.passTest, url: 'http://startup-course.com/test/0' }, { text: lang.callBack.goToMenuCallback, callback_data: 'goToMainMenu' }],
    [{ text: lang.callBack.previousSlide, callback_data: 'lesson15' }, { text: lang.callBack.glossary, url: 'http://startup-course.com/ru/glossary.html' }, { text: lang.callBack.nextSlide, callback_data: 'lesson1' }],
    [{ text: lang.callBack.goToBeginList, callback_data: 'lesson0' }, { text: lang.callBack.goToEndList, callback_data: 'lesson15' }]
];

const lessonsButtons = {
    reply_markup: JSON.stringify({
        keyboard: [
            [lang.menus.lessonsMenu[0], lang.menus.lessonsMenu[1]],
            [lang.menus.lessonsMenu[2], lang.menus.lessonsMenu[3]],
            [lang.menus.lessonsMenu[4], lang.menus.lessonsMenu[5]],
            [lang.menus.lessonsMenu[6], lang.menus.lessonsMenu[7]],
            [lang.menus.lessonsMenu[8], lang.menus.lessonsMenu[9]],
            [lang.menus.lessonsMenu[10], lang.menus.lessonsMenu[11]],
            [lang.menus.lessonsMenu[12], lang.menus.lessonsMenu[13]],
            [lang.menus.lessonsMenu[14], lang.menus.lessonsMenu[15]],
            [lang.buttons.goToMainMenu]

        ]
    })
}

bot.onText(/\/start/, async msg => {
    if (msg.from.last_name) chats.child(msg.from.id).child('lname').set(msg.from.last_name);
    if (msg.from.username) chats.child(msg.from.id).child('Telegram_Username').set(msg.from.username);
    chats.child(msg.from.id).child('fname').set(msg.from.first_name);

    chats.once('value', function (snapshot) {
        let bd = snapshot.toJSON();

        if (bd[msg.from.id].is_started_course) {
            bot.sendMessage(msg.from.id, lang.MSGs.welcomeToMainMenu, mainMenuButtons);
            return;
        } else {
            bot.sendMessage(msg.from.id, lang.MSGs.msgZaSkolkoProiti, timeToCourseButtons)
            return;
        }
    });

    return;

});

const commandList = ["/start"];

bot.on('message',  async msg => {

    if (!msg.text || msg.from.is_bot || msg.chat.id != msg.from.id || msg.contact) return;
    if (commandList.includes(msg.text.toLowerCase())) return;
    console.log(msg);

    let curDate = Date(msg.date);
    console.log(curDate)

    chats.once('value', async function (snapshot) {
        let bd = snapshot.toJSON();
        if (bd[msg.from.id].is_started_course) {

            if (msg.text == lang.buttons.goToMainMenu ){
                return bot.sendMessage(msg.from.id, lang.MSGs.welcomeToMainMenu, mainMenuButtons);
            }

            if (msg.text == lang.menus.mainMenu.lessons) {
                let a = await bot.sendMessage(msg.from.id, "Список уроков:", lessonsButtons);
                // bot.deleteMessage(a.chat.id, a.message_id);

                return bot.sendMessage(msg.from.id, "startup-course.com/0", { reply_markup: { inline_keyboard: lessonsMenu } });
            }

            if (msg.text.match(/^[0-9]{1,2}/)){
                if (parseInt(msg.text) > 15) return;
                let numLesson = parseInt(msg.text);
        
                bot.sendMessage(msg.from.id, `https://startup-course.com/${numLesson}`);
                return
            }
        
            bot.sendMessage(msg.from.id, `${lang.MSGs.msgFindTextSite}http://yandex.kz/search/?text=site%3Astartup-course.com%20${msg.text.replace(' ', '%20')}`)

        } else {

            if (msg.text == lang.timeToCourse.week_15) {
                chats.child(msg.from.id).child('timeToCourse').set("week_15");
                bot.sendMessage(msg.from.id, lang.MSGs.forContinueUseTelephone, { reply_markup: JSON.stringify({ keyboard: [[{ text: lang.buttons.enterPhoneNumber, request_contact: true }]] }) })
                return;
            }

            if (msg.text == lang.timeToCourse.week_5) {
                chats.child(msg.from.id).child('timeToCourse').set("week_5");
                bot.sendMessage(msg.from.id, lang.MSGs.forContinueUseTelephone, { reply_markup: JSON.stringify({ keyboard: [[{ text: lang.buttons.enterPhoneNumber, request_contact: true }]] }) })
                return;
            }

            if (msg.text == lang.timeToCourse.day_15) {
                chats.child(msg.from.id).child('timeToCourse').set("day_15");
                bot.sendMessage(msg.from.id, lang.MSGs.forContinueUseTelephone, { reply_markup: JSON.stringify({ keyboard: [[{ text: lang.buttons.enterPhoneNumber, request_contact: true }]] }) })
                return;
            }

            
            bot.sendMessage(msg.from.id, lang.MSGs.notAutorized);
            return;
        }
    });


    

    return;
});

bot.on("contact", msg => {
    console.log(msg)

    if (msg.reply_to_message.text == lang.MSGs.forContinueUseTelephone) {
        chats.child(msg.from.id).child('telephone').set(msg.contact.phone_number);
        chats.child(msg.from.id).child('is_started_course').set(true);
        bot.sendMessage(msg.from.id, lang.MSGs.successAutorization, mainMenuButtons);
        bot.sendMessage(msg.from.id, lang.lessons[0].start, { reply_markup: { inline_keyboard: lessonsMenu } });

        chats.once('value', function (snapshot) {
            let bd = snapshot.toJSON();

            let msgDate = new Date(msg.date);
            if (bd[msg.from.id].timeToCourse == "week_15") {
                
                let nextMonday8AM = new Date(msg.date + (Math.abs(msgDate.getDay() - 0) ? Math.abs(msgDate.getDay() - 0) : 7) * 86400000 - config.GMT);
                nextMonday8AM.setHours(8);
                nextMonday8AM.setMinutes(0);
                nextMonday8AM.setSeconds(0);

                reminder.child(msg.from.id).child('course_time').set('week_15');
                reminder.child(msg.from.id).child('time').set(nextMonday8AM.getTime());
                reminder.child(msg.from.id).child('type').set('lesson1');
                reminder.child(msg.from.id).child('user_id').set(msg.from.id);

                bot.sendMessage(msg.from.id, "startup-course.com/0", { reply_markup: { inline_keyboard: lessonsMenu } });

            } else if (bd[msg.from.id].timeToCourse == "week_5") {
                let nextMonday8AM = new Date(msg.date + (Math.abs(msgDate.getDay() - 0) ? Math.abs(msgDate.getDay() - 0) : 7) * 86400000 - config.GMT);
                nextMonday8AM.setHours(8);
                nextMonday8AM.setMinutes(0);
                nextMonday8AM.setSeconds(0);

                reminder.child(msg.from.id).child('course_time').set('week_5');
                reminder.child(msg.from.id).child('time').set(nextMonday8AM.getTime());
                reminder.child(msg.from.id).child('type').set('lesson1');
                reminder.child(msg.from.id).child('user_id').set(msg.from.id);

                bot.sendMessage(msg.from.id, "startup-course.com/0", { reply_markup: { inline_keyboard: lessonsMenu } });

            } else if (bd[msg.from.id].timeToCourse == "day_15"){                                                                                                            
                
                let nextDay = new Date(msg.date + 86400000 - config.GMT);
                nextDay.setHours(8);
                nextDay.setMinutes(0);
                nextDay.setSeconds(0);
                console.log(nextDay.getTime())

                reminder.child(msg.from.id).child('course_time').set('day_15');
                reminder.child(msg.from.id).child('time').set(nextDay.getTime());
                reminder.child(msg.from.id).child('type').set('lesson1');
                reminder.child(msg.from.id).child('user_id').set(msg.from.id);

                bot.sendMessage(msg.from.id, "startup-course.com/0", { reply_markup: { inline_keyboard: lessonsMenu } });

            }else {                                                                                                         
                bot.sendMessage(msg.from.id, lang.MSGs.notCheat);                                                                                                           
            }                                                                                                           
                                                                                        
        });                                                                             

        return;
    }
    return;
})


bot.on('callback_query', q => {
    console.log(q)

    let lessonsMenuTemp = lessonsMenu;

    if (q.data.match(/lesson/)) {
        let numLesson = parseInt(q.data.slice(6));

        lessonsMenuTemp[0][0].url = `https://startup-course.com/test/${numLesson}`;

        if (numLesson == 0) {
            lessonsMenuTemp[1][0].callback_data = `lesson15`;
        } else lessonsMenuTemp[1][0].callback_data = `lesson${numLesson - 1}`;


        if (numLesson == 15) {
            lessonsMenuTemp[1][2].callback_data = `lesson0`;
        } else lessonsMenuTemp[1][2].callback_data = `lesson${numLesson + 1}`;

        bot.editMessageText(`https://startup-course.com/${numLesson}`, {
            chat_id: q.message.chat.id,
            message_id: q.message.message_id,
            reply_markup: { inline_keyboard: lessonsMenuTemp }
        });
        return;
    }

    if (q.data == "goToMainMenu") {
        bot.sendMessage(q.message.chat.id, lang.MSGs.welcomeToMainMenu, mainMenuButtons);
        return;
    }




});



// setInterval(function () {
//     reminder.once('value', function (snapshot) {
//         let bd = snapshot.toJSON();
//         console.log(bd);
//         let curDate = new Date();
//         bd.forEach(users => {

//             if (Math.abs(users.time - curDate.getTime()) < 30000){

//                 let lessonsMenuTemp = lessonsMenu;

//                 if (users.type.match(/lesson/)) {
//                     let numLesson = parseInt(users.type.slice(6));
//                     lessonsMenuTemp[0][0].url = `https://startup-course.com/test/${numLesson}`;
            
//                     if (numLesson == 0) {
//                         lessonsMenuTemp[1][0].callback_data = `lesson15`;
//                     } else lessonsMenuTemp[1][0].callback_data = `lesson${numLesson - 1}`;
            
            
//                     if (numLesson == 15) {
//                         lessonsMenuTemp[1][2].callback_data = `lesson0`;
//                     } else lessonsMenuTemp[1][2].callback_data = `lesson${numLesson + 1}`;
            
//                     bot.sendMessage(users.user_id, `https://startup-course.com/${numLesson}`, { reply_markup: { inline_keyboard: lessonsMenuTemp } });
//                     return;
//                 }



//             }

//         });



//     })
// }, 30000);
