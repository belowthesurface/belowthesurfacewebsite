var express = require('express'),
  validator = require('express-validator');
var paypal = require('paypal-rest-sdk');
var valid = require('card-validator');

var router = express.Router();
router.use(validator());

var EmailList = require('../models/models').EmailList;

function validate(req) {
  req.checkBody('name', 'the form is empty').notEmpty();
  req.checkBody("name", "Enter a valid name.").isString();
  req.checkBody('email', 'the form is empty').notEmpty();
  req.checkBody("email", "Enter a valid email address.").isEmail();
}

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.SANDBOX_PAYPAL,
  'client_secret': process.env.SANDBOX_PAYPAL_SECRET
});

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

router.post('/donate', function(req, res) {
  var numberValidation = valid.number(req.body.cardnumber);

  if (!numberValidation.isPotentiallyValid) {
    res.render('donate', {
      body: req.body,
      expressFlash: 'Invalid card number'
    })
  } else {

    var monthValidation = valid.expirationMonth(req.body.expirationMonth);
    var yearValidation = valid.expirationYear(req.body.expirationYear);
    var cvvValidation = valid.cvv(req.body.cvv);

    if (monthValidation.isPotentiallyValid && yearValidation.isPotentiallyValid) {

      if (cvvValidation.isPotentiallyValid) {

        var create_payment_json = {
          "intent": "sale",
          "payer": {
            "payment_method": "credit_card",
            "funding_instruments": [{
              "credit_card": {
                "type": numberValidation.card.type,
                "number": req.body.cardnumber,
                "expire_month": req.body.expirationMonth,
                "expire_year": req.body.expirationYear,
                "cvv2": req.body.cvv,
                "first_name": req.body.firstName,
                "last_name": req.body.lastName,
                "billing_address": {
                  "line1": req.body.addressline,
                  "city": req.body.cty,
                  "state": req.body.state,
                  "postal_code": req.body.postalcode,
                  "country_code": "US"
                }
              }
            }]
          },
          "transactions": [{
            "amount": {
              "total": req.body.amount,
              "currency": "USD",
              "details": {
                "subtotal": "7",
                "tax": "0",
                "shipping": "0"
              }
            },
            "description": "Donation to Below the Surface"
          }]
        };

        paypal.payment.create(create_payment_json, function(error, payment) {
          if (error) {
            throw error;
          } else {
            console.log("Create Payment Response");
            console.log(payment);
          }
        });

      } else {
        res.render('donate', {
          body: req.body,
          expressFlash: 'Invalid cvv'
        })
      }


    } else {
      res.render('donate', {
        body: req.body,
        expressFlash: 'Invalid data'
      })
    }
  }
});


router.get('/success', function(req, res) {
  var paymentId = req.query.paymentId;
  var payerId = {
    'payer_id': req.query.PayerID
  };

  paypal.payment.execute(paymentId, payerId, function(error, payment) {
    if (error) {
      console.error(error);
    } else {
      if (payment.state === 'approved') {
        res.send('payment completed successfully');
        console.log(payment);
      } else {
        res.send('payment not successful');
      }
    }
  });
});

module.exports = router;