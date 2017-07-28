var mongoose = require('mongoose');

var emailListSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  email: {
    type: String,
    require: true
  }
}, {
  timestamps: true
})

var emailList = mongoose.model("emailList", emailListSchema)

module.exports = {
  EmailList: emailList
};