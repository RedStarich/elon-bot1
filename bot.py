import telebot
bot = telebot.TeleBot("6622570779:AAFB6LQY8-jOzfDpNAWMIcwL7PPuLMi1M80")


@bot.message_handler(content_types=['text'])
def send_text(msg):
    print(msg)


bot.polling()