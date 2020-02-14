var express = require("express");
var router = express.Router();
var passport = require("passport");
var question = require("../models/question.js");
var user = require("../models/user.js");
var nodemailer = require("nodemailer");
var async = require("async");
var hash = require("randomstring");
var champion = {};


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// homepage and also the that shows the question
router.get("/", function(req, res){

 if(req.user) {
 async.waterfall([
   function(callback) {
     user.findOne({"isAdmin": false}).sort("-qheson").exec(function(err, member){

       console.log(member.qheson + "member qheson");
       if(champion && champion.qheson === member.qheson) {
         console.log("There is another champion for this question.");
       } else {
         champion = member;
       }

       callback(err, champion);
     });

   }, function(champion, callback) {
     question.count({}, function(err, count){
       var qcount = count;
       callback(err, champion, qcount);
     });
   },

   function(champion, qcount, callback) {
     user.count({"qheson": champion.qheson}, function(err, count){
       var ccount = count;
       callback(err, champion, qcount, ccount);
     });
   },

   function(champion, qcount, ccount, callback) {
     user.count({}, function(err, count){
       var ucount = count;
       callback(err, champion, qcount, ucount, ccount);
     });
   },
    function(champion, qcount, ucount, ccount, callback) {

       question.findOne({"sort": req.user.qheson}, function(err, fq){
         if(err) {
           console.log(err);
         }else {

           res.render("index", {question: fq, champion: champion, qcount: qcount, ucount: ucount, ccount: ccount});
         }
       });

   }

 ], function(err){
   if(err){console.log(err);}
   else {
     console.log(champion + " champion");
   }

 });
} else {
     res.render("index");
   }


});


// for me to add new questions if I'm not able to edit/add something to the the database.

router.get("/addquestion", function(req, res){
  if(req.user && req.user.isAdmin) {  //&& req.user.isAdmin
    res.render("question");
  } else {
    res.send("You are not permitted to do this.");
  }

});

// post route for above.

router.post("/addquestion", function(req, res){
  if(req.user && req.user.isAdmin) {
    var newQ = req.body.question;

    question.count({}, function(err, count){
      newQ.sort = count + 1;
      question.create(newQ, function(err, newquestion){
      if(err) {
        console.log("anassssn");
        res.redirect("back");
      } else {
        console.log(newQ.sort + "ha bunewq dur");

        res.redirect("/");
      }
    });

    });
} else {
    res.send("You're not permitted to do that.");
  }

});

// registration page render

router.get("/signup", function(req, res){
  res.render("signupf");
});

// putting environment variables to variables for nodemail
var mailadress = process.env.MAIL_ADRESS;
var mailpass = process.env.MAIL_PASS;


// post route for the registration page. I have email verification but I put it for the sake of learning/practicing it, users can verify their accounts but have no disadvantage if they do not.
router.post("/signup", function(req, res){

  user.register(new user({username: req.body.username, email: req.body.email}), req.body.password, function(err, user){
    if(err) {

      req.flash("error", err.message);
      return res.redirect("/signup");
    }
    passport.authenticate("local")(req, res, function(){



      async.waterfall([
        function(done) {
          var token = hash.generate(20);
          console.log(token);
          done(err, token);
        },
        function(token, done) {
          user.aktivasyonkodu = token;
          user.aktivasyonsure = Date.now() + 3600000;

          user.save(function(err){
            done(err, token, user);
          });

        },
        function(token, user, done) {
          var smtpTransport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
              user: mailadress,
              pass: mailpass
            }
          });
          var mailOptions = {
            to: user.email,
        from: mailadress,
        subject: "Maltoshi's Riddle Aktivasyon",
        text:
          'Aslında bu bir işe yaramıyor fakat yine de hesabınızı aktifleştirmek için aşağıdaki linke tıklayınız:\n\n' +
          'http://' + req.headers.host + "/verification/" +  token
        };
        smtpTransport.sendMail(mailOptions, function(err){
          console.log("mail sent");
          done(err, done);
        });

        }
      ], function(err) {
        if(err) {
          console.log(err);
          //res.redirect("/");

        }
        console.log(req.user.verified);
        req.flash("success", "Successfully signed up.");
        res.redirect("/");
      });

    });
  });

});

  //===============================================================================================================================

//});

//login page renger
router.get("/login", function(req, res){
  res.render("login");
});
//post route for the login page
router.post("/login",passport.authenticate("local",
 {
  successRedirect: "/",
  failureRedirect: "/login"
}
), function(req, res){

});

//logout
router.get("/logout", function(req, res){
  req.logout();
  req.flash("success", "Successfully logged out.");
  res.redirect("/");
});
//post route for submitting the answers.
router.post("/", isLoggedIn, function(req, res){

  var ua = req.body.answer;
  question.findOne({"sort": req.user.qheson}, function(err, q){
    if(err) {
      res.redirect("/");
    } else {
      if(ua && (q.answer == ua.toLowerCase())) {
        req.user.qheson += 1;
        req.user.save(function(err){
          if(err) {
            console.log(err);
          }
        });
        req.flash("success", "Your answer is right!");

        res.redirect("/");
      } else {
        console.log("wrong answer");
        req.flash("error", "Your answer is wrong.");
        res.redirect("/");
      }
    }
  });

});

// route for verification of e-mail

router.get("/verification/:token", function(req, res){
    if(req.params.token == req.user.aktivasyonkodu && Date.now() < req.user.aktivasyonsure) {
      req.user.verified = true;

      req.user.save(function(err){
        console.log(err);
      }) ;
      console.log(req.user.verified);
      req.flash("success", "You successfully confirmed your account.");
      res.redirect("/");
    } else {
      res.redirect("/");
    }
});

//about page showing what the game is about, and having my contact information.

router.get("/about", function(req, res){
  res.render("about");
});

// I had a little prize for the first person to answer all questions. If they don't use the e-mail they used while signing up, they have to confirm the account is theirs by just telling which mail adress they used while signing up, and if they forgot it they can go to this route and learn which one.
router.get("/verifikasyon", function(req, res){
  res.send("mail: " + req.user.email);
});







// isLoggedIn middleware
function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please login first!");
    res.redirect("/login");
}











module.exports = router;
