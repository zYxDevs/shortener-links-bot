var request = require('request');
var Telegraf = require('telegraf');
var { Extra, Markup } = Telegraf;
var config = require('./config');

require('./db');

var app = new Telegraf(config.tgtoken, { username: 'ShrtenBot' });

app.telegram.getMe().then(botInfo => app.options.username = botInfo.username);

// app.use(Telegraf.log());

app.command('start', ctx => {
  var uname = ctx.from.username ? ctx.from.username : 'friend';
  var data = {
    id: ctx.from.id,
    username: uname
  };
  var user = new db.users(data);

  db.users.find(data).then(results => {
    if (!results[0]) user.save();
  });

  ctx.reply(`*Hello, my dear ${uname}!*\n\nI'm bot and I can:\n\n— shorten your link;\n— decrypt your link (show original).\n\nAny message bot receives as a link and tries to reduce it.\n\n/long <link> — decrypt your link (show original).`, Extra.markdown());
});

app.command('help', ctx => {
  ctx.reply('Any message bot receives as a link and tries to reduce it.\n\n/long <link> — decrypt your link (show original).\n\nPowered by @SpreadNetworks.', Extra.markdown());
});

app.hears(/\/long (.+)/, ctx => {
  var link = ctx.match[1];

  if (link.search('http') == -1) {
    var url = `http://${link}`;

    link = url;
  }

  request(link, (err, response, body) => {
    if (!err && response.statusCode == 200) {
      ctx.reply(`http://${response.socket._host}${response.socket._httpMessage.path}`);
    } else {
      ctx.reply('Unable to decrypt your link. ☹️');
    }
  });
});

app.command(['short', 'long'], ctx => {
  ctx.reply('You did not enter a link. For additional help, type /help.');
});

app.command('users', ctx => {
  if (ctx.from.id == 91990226) {
    db.users.find({}).then(results => {
      var users = `*Всего пользователей:* ${results.length}\n\n`;

      results.forEach(item => {
        users += `${item.username} (${item.id}), `;
      });

      ctx.reply(users, Extra.markdown());
    }).catch(error => ctx.reply(error.toString()));
  } else {
    ctx.reply('Access denied.');
  }
});

app.command('drop', ctx => {
  if (ctx.from.id == 91990226) {
    db.users.remove().then(response => ctx.reply(response.toString())).catch(error => ctx.reply(error.toString()));
  } else {
    ctx.reply('Access denied.');
  }
});


// Shortener by default
app.on('message', ctx => {
  var link = ctx.message.text;

  if (link.search('http') == -1) {
    var url = `http://${link}`;

    link = url;
  }

  request({
    uri: 'https://api.rebrandly.com/v1/links',
    method: 'POST',
    body: JSON.stringify({ destination: link }),
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.shtoken
    }
  }, (err, response, body) => {
    if (!err && response.statusCode == 200) {
      var res = JSON.parse(body);

      ctx.reply(res.shortUrl);
    } else {
      ctx.reply('Unable to shorten your link. ☹️');
    }
  });
});

app.startPolling();
