var validator = require('express-validator');
var paypal = require('paypal-rest-sdk');
var valid = require('card-validator');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setSubstitutionWrappers('{{', '}}'); // Configure the substitution tag wrappers globally

var helper = require('sendgrid').mail;


var EmailList = require('../models/models').EmailList;

module.exports = function(app) {

app.use(validator());

function validate(req) {
  req.checkBody('email', 'the form is empty').notEmpty();
  req.checkBody("email", "Enter a valid email address.").isEmail();
  req.checkBody("email", "The length of email is incorrect!.").isByteLength({min: 3, max: 30});
}

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.SANDBOX_PAYPAL,
  'client_secret': process.env.SANDBOX_PAYPAL_SECRET
});

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/email', function(req, res) {
  var errors = validate(req);
  if (!errors) {
    EmailList.find({
      email: req.body.email[1]
    }).exec(function(err, email) {
      if (err) {
        res.render('index', {
          body: req.body,
          expressFlash: err
        });
      } else {
        console.log(email)
        console.log(email.length)
        console.log(req.body.email)
        if (email.length < 1) {
          var newemail = new EmailList({
            email: req.body.email[1]
          });

          newemail.save(function(err) {
            if (!err) {
              const msg = {
                to: req.body.email[1],
                from: 'LeadersBelowTheSurface@gmail.com',
                subject: "Welcome to Below the Surface!",
                html: '<p>You have officially subscribed to Below the Surface</p>',
                templateId: '72b4d688-826c-4b7d-b5bd-f8376e359852'
              };

              sgMail.send(msg, (error, result) => {
                if (error) {
                  console.log(error);
                }
                else {
                  console.log('Yay! Our templated email has been sent')
                }
              });

           
              res.render('index', {
                  checkformessage: true
              });
            } else {
              req.flash('error', err);
              res.render('index', {
                expressFlash: err
              });
            }
          });

        } else {
          res.render('index', {
            body: req.body,
            expressFlash: 'You already sign up.'
          });
        }
      }

    });

  } else {
    console.log(errors[0])
    res.render('index', {
      email: req.body.email,
      expressFlash: errors[0]
    });
  }

});

app.get('/donate', function(req, res) {
  res.render('donate');
});

app.post('/donate', function(req, res) {
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
        var firstName = req.body.fullName.split(' ').slice(0, -1).join(' ');
        var lastName = fullName.split(' ').slice(-1).join(' ');

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
                "subtotal": req.body.amount,
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


app.get('/success', function(req, res) {
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

};