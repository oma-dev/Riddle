var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var indexroute = require("./routes/index.js");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("./models/user");
var flash = require("connect-flash");





app.use(require('cookie-session')({
  name: 'session',
    keys: ["touche"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));




app.set("view engine", "ejs");
app.use(flash());

app.use(express.static(__dirname + "/public"));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// making environment variables ready for mongodb

var mongoname = process.env.MONGO_NAME;
var mongopass = process.env.MONGO_PASS;


//I use these comments to test my website on a local database.

//mongoose.connect("mongodb://localhost/riddle");
mongoose.connect("mongodb://" + mongoname + ":" + mongopass + "@ds125181.mlab.com:25181/riddle");

app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next){
    res.locals.cuser = req.user;    //study this
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");

    next();
});

app.use(indexroute);


// same, for testing it on local host.

// app.listen(8080, function(){
//   console.log("Go.");
// });


app.listen(process.env.PORT, process.env.IP, function(){
  console.log("Go.");
});
