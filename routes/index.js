var express = require('express'),
  validator = require('express-validator');

var router = express.Router();
router.use(validator());

var EmailList = require('../models/models').EmailList;

function validate(req) {
  req.checkBody('name', 'the form is empty').notEmpty();
  req.checkBody("name", "Enter a valid name.").isString();
  req.checkBody('email', 'the form is empty').notEmpty();
  req.checkBody("email", "Enter a valid email address.").isEmail();
}

router.get('/', function(req, res) {
  res.render('index');
});

router.post('/email', function(req, res) {
  validate(req);
  var errors = req.validationErrors();
  if (!errors) {
    EmailList.findOne({
      email: req.body.email
    }).exec(function(err, contact) {
      if (err) {
        res.render('contact', {
          body: req.body,
          expressFlash: err
        });
      } else {
        if (!contact) {
          var contact = new EmailList({
            email: req.body.email
          });

          contact.save(function(err) {

            if (!err) {

              Email.count({}).exec(function(err, count) {
                res.render('contact', {
                  checkformessage: true
                });
              });
            } else {
              req.flash('error', err);
              res.render('contact', {
                expressFlash: err
              });
            }
          });
        } else {
          res.render('contact', {
            body: req.body,
            expressFlash: 'You can sending the same message'
          });
        }
      }

    });

  } else {
    res.render('contact', {
      email: req.body.email,
      expressFlash: errors[0].msg
    });
  }

});

router.get('/donate', function(req, res) {
  res.render('donate');
});

module.exports = router;