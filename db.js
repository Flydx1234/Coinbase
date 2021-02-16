const mongoose = require('mongoose');
const fs = require("fs");
const path = require("path");
const fn = path.join(__dirname,"config.json");
const data = fs.readFileSync(fn);
const conf = JSON.parse(data);
let uri = conf.db_uri;

const User = new mongoose.Schema({
  _id: {type:String, required:true},
  accessToken: {type:String, required:true},
  refreshToken: {type:String, required:true},
});



mongoose.model("User",User);

mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true},function(err){
  if(err){
    throw err;
  }
});
