var db = require('../db/index.js');

module.exports = {
  users: {
    get: function (user,callback) {
      var query = 'Select id,name,email,address_id,birthday, avatar from users where name = "'+ user.username +'" and password = "'+user.password+'"';
      db.query(query, function(err, results) {
        callback(err, results);
      });
    },
    post: function (user, callback) {
      var queryAddress = 'insert into address (street, number, city, postalcode) SELECT * FROM (select "'+ user.address.street +'",'+user.address.number+',"'+user.address.city+'",'+user.address.postalcode+') AS temp WHERE NOT EXISTS (SELECT id FROM address WHERE postalcode= '+ user.address.postalcode+' and number = '+user.address.number+')LIMIT 1';
      db.query(queryAddress, function(err, results) {
        var queryUser = 'insert into users (name,email,address_id,phoneNumber,birthday,password) values ("'+ user.name +'","'+user.email+'", (SELECT id FROM address WHERE postalcode= '+ user.address.postalcode+' and number = '+user.address.number+'),"'+user.phoneNumber+'","'+user.birthday+'" ,"'+user.password+'")';
        db.query(queryUser, function(err, results) {
          console.log('Error signup',err);
          console.log('results signup',results);
          callback(err, results);
        });
      });
    }
  },
  findUser: function(user, callback) {
    var query = 'Select token from Users where username = "'+ user.username +'"';
    db.query(query, function(err, results) {
      callback(err, results);
    });
  },
  findUserById: function(userid, callback) {
    var query = 'SELECT id, name FROM users WHERE id = ' + userid;
    db.query(query, function(err, results) {
      callback(err, results[0]);
    });
  },
  findOrCreate: function(profile, callback) {
    console.log('profile:', profile);
    console.log('==========================');
    var findQuery = 'Select id, name from Users where ';
    var query = findQuery + 'googleid = "'+ profile.id +'" LIMIT 1';
    db.query(query, function(err, results) {
      if (err) { return callback(err); }
      if (results.length) {
        callback(null, results[0]);
      } else {
        query = 'INSERT INTO Users SET ';
        query += 'googleid = "' + profile.id + '", ';
        query += 'name = "' + profile.displayName + '", ';
        query += 'familyName = "' + profile.name.familyName + '", ';
        query += 'givenName = "' + profile.name.givenName + '", ';
        query += 'email = "' + profile.emails[0].value + '", ';
        query += 'avatar = "' + profile.photos[0].value + '" ';
        db.query(query, function(err, results) {
          var query = 'Select id, name from Users where googleid = "'+ profile.id +'" LIMIT 1';
          db.query(query, function(err, results) {
            if (err) { return callback(err); }
            callback(null, results[0]);
          });
        });
      }
    });
  },
};

// insert into address (postalcode) values (94504);
// insert into users (name,email,address_id,phoneNumber,birthday,type,password,item_Id) values ('John','john@john.com', (SELECT id FROM address WHERE postalcode=94101) ,48343432, '2015-6-9' ,'admin','password', (SELECT id FROM items WHERE name='laptop'));
