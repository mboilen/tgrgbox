var https = require('https');
var dotenv = require('dotenv').config();

var authorization = process.env.BOT_TOKEN;
var guild = process.env.GUILD_ID;
var users = process.env.USERS.split('|').map((e) => e.toLowerCase());

var str = "";
var snowflakes = {};
var req = https.request({
        hostname: 'discord.com',
        port: 443,
        path: '/api/v9/guilds/' + guild + '/members?limit=1000',
        method: 'GET',
        headers: { 'Authorization' : 'Bot ' + authorization }
    }, res => {
        res.on('data', chunk => {
            str += chunk;
        });
        res.on('end', function() {
            var results = JSON.parse(str);
            if (results.message && results.message.includes('401')) {
                console.log(results);
            } else {
                results.forEach( (result) => {
                    //console.log(result);
                    if (users.includes(result.user.username.toLowerCase())) {
                        snowflakes[result.user.username.toLowerCase()] = 
                            { 'username' : result.user.username,
                              'id': result.user.id };
                    }
                });

                //We've collected all the snowflakes, now generate the correct expression.
                console.log(snowflakes);
                var fakeEmails = []
                users.forEach( (user) => {
                    if (snowflakes[user]) {
                        console.log('#' + snowflakes[user].username + " => " + snowflakes[user].id);
                        fakeEmails.push(snowflakes[user].id + "@discord.com");
                    } else {
                        console.error("Couldn't find snowflake for user " + user);
                    }
                });
                console.log(fakeEmails.join(','));
            }
        });
        res.on('error', function(e) {
            console.log('error');
            console.log(e);
        });
    });
req.end();
