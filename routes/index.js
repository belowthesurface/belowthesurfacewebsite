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

router.post('/', function(req, res) {
  validate(req);
  var errors = req.validationErrors();
  if (!errors) {
    Contact.findOne({
      email: req.body.email,
      interested: req.body.interested,
      content: req.body.content
    }).exec(function(err, contact) {
      if (err) {
        res.render('contact', {
          body: req.body,
          expressFlash: err
        });
      } else {
        if (!contact) {
          var contact = new Contact({
            name: req.body.name,
            email: req.body.email,
            content: req.body.content,
            interested: req.body.interested
          });

          contact.save(function(err) {

            if (!err) {
              from_email = new helper.Email(req.body.email);
              to_email = new helper.Email('newvuew@gmail.com');
              subject = req.body.interested;
              content = new helper.Content('text/html', '<p>' + req.body.interested + '</p>');
              mail = new helper.Mail(from_email, subject, to_email, content);
              mail.setTemplateId('554df4c0-e9b6-49a4-a4e2-0468b0e35106');

              var request = sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: mail.toJSON()
              });

              sg.API(request, function(error, response) {
                if (error) {
                  return console.log(error);
                }
                console.log(response)
                console.log('Yay! Our templated email has been sent')
              })

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

module.exports = router;