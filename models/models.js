var mongoose = require('mongoose');

var contactSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  email: {
    type: String,
    require: true
  },
  interested: {
    type: String,
    require: true
  },
  content: {
    type: String,
    require: true
  },
}, {
  timestamps: true
})

var Contact = mongoose.model("Contact", contactSchema)

module.exports = {
  Contact: Contact
};