'use strict'
require("./db.js");
const express = require('express');
const expressHbs =  require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);
const User = mongoose.model("User");
const PORT = process.env.PORT || 3000;

//coinbase api
let client_id,client_secret,grant_type,redirect_uri;
if(process.env.NODE_ENV === 'PRODUCTION'){
  client_id = process.env.client_id;
  client_secret = process.env.client_secret;
  grant_type = process.env.grant_type;
  redirect_uri = process.env.redirect_uri;
}
else{
  const fs = require("fs");
  const path = require("path");
  const fn = path.join(__dirname,"config.json");
  const data = fs.readFileSync(fn);
  const conf = JSON.parse(data);
  client_id = conf.client_id;
  client_secret = conf.client_secret;
  grant_type = conf.grant_type;
  redirect_uri = conf.redirect_uri;
}
const url = `https://www.coinbase.com/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=wallet%3Auser%3Aread`;


// Create the express app
const app = express();


// Routes and middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser())

const hbs = expressHbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true
    },
});
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars',hbs.engine);
app.set("view engine","handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


app.get("/",(req,res)=>{
  res.render("index");
});

app.get("/authorize",(req,res)=>{
  res.redirect(url);
});

app.get("/login", (req,res)=>{
  const code = req.query.code;
  if(code != undefined){
    axios({
      method: "post",
      url: "https://api.coinbase.com/oauth/token",
      data: `grant_type=authorization_code&code=${code}&client_id=${client_id}&client_secret=${client_secret}&redirect_uri=${redirect_uri}`
      }).then(response=>{
        const at = response.data.access_token;
        const rt = response.data.refresh_token
        axios({
          method: "get",
          url: "https://api.coinbase.com/v2/user",
          headers:{
            "Authorization": `Bearer ${at}`
          }
        }).then(response=>{
          const id = response.data.data.id;
          const user = new User({
            _id: id,
            accessToken:at,
            refreshToken:rt,
          });
          User.countDocuments({_id:id},(err,count)=>{
            if(err) throw (err);
            if(count === 0){
              user.save(err=>{
                if(err) throw (err);
              });
            }
            res.cookie('userId', id);
            res.redirect("/");
          });
        }).catch(err=>{
          console.log(err);
        });
    }).catch((err)=>{
      console.log(err);
    });
  }
  else{
    res.redirect("/authorize");
  }
});






// Error handlers
app.use(function fourOhFourHandler (req, res) {
  res.status(404).send();
});
app.use(function fiveHundredHandler (err, req, res, next) {
  console.error(err);
  res.status(500).send();
});






// Start server
app.listen(PORT, function (err) {
  if (err) {
    return console.error(err);
  }

  console.log(`Started at http://localhost:${PORT}`);
});
