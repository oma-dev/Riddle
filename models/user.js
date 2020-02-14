var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var userSchema = new mongoose.Schema({
  username: {type: String, unique: true, required: true},
  password: {type: String},
  verified: {type: Boolean, default: false},
  aktivasyonkodu: String,
  aktivasyonsure: Date,
  isAdmin: {
    type: Boolean,
    default: false
  },
  email: {type: String, unique: true, required: true},
  qheson:
  {
    type: Number,
    default: 1
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
