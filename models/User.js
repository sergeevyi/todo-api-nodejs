
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    username: String,
    password: String,
    email: String,
    created: String
  });
  
  module.exports = model('User', userSchema);