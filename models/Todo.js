const { model, Schema } = require("mongoose");

const todoSchema = new Schema({
  body: String,
  created: String,
  username: String, // who created it
  user: {
    // referencing the User docutment
    type: Schema.Types.ObjectId,
    ref: 'users'
  }
});

module.exports = model("Todo", todoSchema);