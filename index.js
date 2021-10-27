require('dotenv').config()
const db = require('./db.js')
const TelegramBot = require('node-telegram-bot-api')
const web3 = require('./web3.js')
// Init DB
db.init()

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.KEY

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true })

let data = db.get('db')
console.log(data)
// Matches "/echo [whatever]"
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  console.log('Chat started with', msg.from.username)
  bot.sendMessage(
    chatId,
    `Hiya, this bot watches Uniswap V3 positions and notifies you if your liquidity is out of range. 
    
    /watch <position #> to subscribe 
    /unwatch <position #> to unsubscribe 
    /ls to list all your watched positions
    /exit to remove all positions
    
    *Note: bot is being dev'd on so it might be buggy*`
  )
})

// Matches "/echo [whatever]"
bot.onText(/\/watch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const id = match[1] // the captured "whatever"
  if (!isNumeric(id))
    return bot.sendMessage(chatId, 'Please try again with an ID number')

  const inRange = await web3.getPosition(id)

  data.push({ pos: id, chat: chatId, owner: msg.from.id, inRange })
  db.set('db', data)
  bot.sendMessage(
    chatId,
    `Watching position #${id}. Currently ${
      inRange ? 'in range' : 'out of range!'
    }`
  )
})
// Matches "/echo [whatever]"
bot.onText(/\/unwatch (.+)/, (msg, match) => {
  const chatId = msg.chat.id
  const id = match[1] // the captured "whatever"
  if (!isNumeric(id))
    return bot.sendMessage(chatId, 'Please try again with an ID number')
  const position = data.find((i) => i.pos === id)
  if (!position) bot.sendMessage(chatId, 'Error: no watcher found')
  if (position.owner === msg.from.id) data = data.filter((i) => i.pos != id)
  db.set('db', data)
  bot.sendMessage(chatId, 'Removed watcher')
})

// Matches "/echo [whatever]"
bot.onText(/\/ls/, (msg) => {
  const chatId = msg.chat.id
  const watched = data.filter((i) => i.owner === msg.from.id)
  bot.sendMessage(
    chatId,
    'You are watching:' + watched.map((i) => ` #${i.pos}`).toString()
  )
})

// Matches "/echo [whatever]"
bot.onText(/\/exit/, (msg) => {
  const chatId = msg.chat.id
  data = data.filter((i) => i.owner != msg.from.id)
  db.set('db', data)
  bot.sendMessage(chatId, 'Removed all of your watchers')
})

function isNumeric(str) {
  if (typeof str != 'string') return false // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ) // ...and ensure strings of whitespace fail
}

const main = async () => {
  for (let index = 0; index < data.length; index++) {
    const position = data[index]
    const inRange = await web3.getPosition(position.pos)
    if (position.inRange != inRange) {
      bot.sendMessage(
        position.chat,
        `#${position.pos} is ${
          inRange ? 'in-range again. yeeiw' : 'out of range. pls fix'
        }`
      )
      data[index] = { ...data[index], inRange }
    }
  }

  for (const position of data) {
  }
}

//start 10sec loop
setInterval(() => {
  main()
}, 30000)
