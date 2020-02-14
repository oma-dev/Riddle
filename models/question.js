var mongoose = require("mongoose");

var questionSchema = new mongoose.Schema({
  text: String,
  image: String,
  sort: Number,
  answer: String
});




module.exports = mongoose.model("Question", questionSchema);
