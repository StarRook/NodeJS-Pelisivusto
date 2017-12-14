const mysql        = require('mysql');

const connection   = mysql.createConnection({

  supportBigNumbers: true,

  bigNumberStrings: true,

  host : 'gator4061.hostgator.com',
  user : 'xxqueeen_aapeli',
  password : 'aapeli',
  database : 'xxqueeen_aapeli'

});

module.exports = connection;