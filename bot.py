import telebot
bot = telebot.TeleBot("YOUR_TELEGRAM_BOT_TOKEN")


@bot.message_handler(content_types=['text'])
def send_text(msg):
    print(msg)


bot.polling()
