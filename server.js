var express = require("express");
var app = express();
var compression = require('compression');
var helmet = require('helmet')
var router = express.Router();
var path = __dirname + '/views/';

app.use(express.static(__dirname + '/public'));
app.use(compression());
app.use(helmet());

var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);


router.use(function(req, res, next) {
  console.log("/" + req.method);
  next();
});

router.get("/", function(req, res) {
  res.sendFile(path + "index.html");
});

// router.get("/about",function(req,res){
//   res.sendFile(path + "about.html");
// });
//
// router.get("/contact",function(req,res){
//   res.sendFile(path + "contact.html");
// });

app.use("/", router);

app.use("*", function(req, res) {
  res.sendFile(path + "404.html");
});

app.listen(process.env.PORT || 3000, function() {
  console.log('listening on *:3000');
});

