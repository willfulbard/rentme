var db = require('../db');

var NUM_ITEMS = 5;

module.exports = {
  profile: function (userId, callback) {
    var resultObj = {};
    var queryRecentItems = 'select i.id,i.name,i.description,i.photo,i.price,s.name as user, ';
    queryRecentItems += 'IFNULL((SELECT SUM(item_rating) / COUNT(*) FROM reviews WHERE items_id = i.id), 0) AS average_rating';
    queryRecentItems += ' FROM items i inner join user_items ui on ui.item_Id = i.id inner join users s on ui.user_Id = s.id where ui.user_Id = ' + userId;
    db.query(queryRecentItems, function(err, results) {
      if (err) {
        console.log('profile query err',err);
      } else {
        resultObj.items4rent = results;
        // get all he reviews for the items
        resultObj.items4rent.forEach(function(e) {
          var queryItemReviews = 'SELECT i.name AS item, r.user_experience, r.item_rating, u.name AS user FROM items i INNER JOIN reviews r ON i.id=r.items_Id INNER JOIN users u ON r.users_Id=u.id WHERE i.name = \'' + e.name + '\';';
          db.query(queryItemReviews, function(err, results) {
            if (err) {
              console.log('item review err: ', err);
            } else {
              e.reviews = results;
            }
          });
        });
      }
      var queryRentingItems = 'SELECT i.id, i.name, i.description, i.photo, i.price, '
        + 's.name AS username, o.name AS ownername, o.id AS ownerid, '
        + 'IFNULL((SELECT SUM(item_rating) / COUNT(*) FROM reviews WHERE items_id = i.id), 0) '
        + 'AS average_rating FROM items i INNER JOIN items_renting ri ON ri.item_Id = i.id '
        + 'INNER JOIN users s ON ri.user_Id = s.id INNER JOIN user_items ui ON '
        + 'i.id = ui.item_Id INNER JOIN users o ON ui.user_Id = o.id where ri.user_Id = '
        + userId + ';';
      db.query(queryRentingItems, function(err, results) {
        if (err) {
          console.log('rented items query err',err);
          callback(err, null);
        } else {
          resultObj.itemsRenting = results;
        }
      });

      var queryFeedbackAsARenter = 'SELECT f.experience, f.rating, f.is_rentee, '
        + 'f.users_Id_rentee, f.users_Id_renter, u.name AS rentee, uu.name AS renter FROM '
        + 'feedback f INNER JOIN users u ON u.id = users_Id_rentee INNER JOIN users uu ON '
        + 'uu.id = users_Id_renter WHERE uu.id = ' + userId + ';';
      db.query(queryFeedbackAsARenter, function(err, results) {
        if (err) {
          console.log('renter feedback query err',err);
          callback(err, null);
        } else {
          resultObj.renterFeedback = results;
        }
      });

      var queryFeedbackAsARentee = 'SELECT f.experience, f.rating, f.is_rentee, '
        + 'f.users_Id_rentee, f.users_Id_renter, u.name AS renter, uu.name AS rentee FROM '
        + 'feedback f INNER JOIN users u ON u.id = users_Id_renter INNER JOIN users uu ON '
        + 'uu.id = users_Id_rentee WHERE uu.id = ' + userId + ';';
      db.query(queryFeedbackAsARentee, function(err, results) {
        if (err) {
          console.log('rentee feedback query err', err);
          callback(err, null);
        } else {
          resultObj.renteeFeedback = results;
          callback(err, resultObj);
        }
      });
    });
  },
  returnRentedItem: function (data, callback) {
    var resultObj = {};
    // insert feedback
    var queryInsertFeedback = 'INSERT INTO feedback (users_Id_rentee, users_Id_renter, experience,'
      + ' rating, is_rentee) VALUES (' + data.rentee_id + ', ' + data.renter_id + ', \''
      + data.feedback.experience + '\', ' + data.feedback.rating + ', 0);';
    db.query(queryInsertFeedback, function(err, results) {
      if (err) {
        console.log('insert feedback query err',err);
        return callback(err);
      } else {
        resultObj.feedback = results;
      }
    });
    // insert review
    var queryInsertReview = 'INSERT INTO reviews (items_Id, users_Id, user_experience,'
      + ' item_rating) VALUES (' + data.review.item_id + ', ' + data.renter_id + ', \''
      + data.review.user_experience + '\', ' + data.review.item_rating + ');';
    db.query(queryInsertReview, function (err, results) {
      if (err) {
        console.log('insert review query err',err);
        return callback(err);
      } else {
        resultObj.review = results;
      }
    });
    // delete item from renting items table
    var queryDeleteRentedItem = 'DELETE FROM items_renting WHERE user_Id = ' + data.renter_id + ';';
    db.query(queryDeleteRentedItem, function (err, results) {
      if (err) {
        console.log('rented item deletion query err',err);
        return callback(err);
      } else {
        resultObj.deletedItem = results;
        callback(null, resultObj);
      }
    });
  },
};
