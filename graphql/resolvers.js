const Todo = require('../models/Todo.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
// some string as a secret to generate tokens.
const SECRET = "sdf43346fhgfghfgh";
var ObjectId = require('mongoose').Types.ObjectId; 
const {
  UserInputError, // Throw an error if empty fields.
  AuthenticationError
} = require('apollo-server');

function validateLogin(username, password) {
  var valid = true
  var errors = []
  if (username == null || username == '') {
    valid = false
    errors.push("empty username")
  }
  if (password == null || password == '') {
    valid = false
    errors.push("empty password")
  }
  return {
    errors: errors,
    valid: valid,
  };
}


const getUser = async auth => {
  if (!auth) throw new AuthenticationError('you must be logged in!');

  const token = auth.split('Bearer ')[1];
  if (!token) throw new AuthenticationError('you should provide a token!');

  const user = await jwt.verify(token, SECRET, (err, decoded) => {
    if (err) throw new AuthenticationError('invalid token!');
    return decoded;
  });
  return user;
};



function validateRegister(username, password, confirmPassword, email) {
  var valid = true
  var errors = []
  if (username == null || username == '') {
    valid = false
    errors.push("empty username")
  }
  if (password == null || password == '') {
    valid = false
    errors.push("empty password")
  }
  return {
    errors: errors,
    valid: valid,
  };
}

const getToken = ({ id, username, email }) =>
  jwt.sign(
    {
      id,
      username,
      email
    },
    SECRET,
    { expiresIn: '1d' }
  );


module.exports = {
  Query: {
    // Get all todos 
    async getTodos(_, { }, { auth }) {
      const user = await getUser(auth);
      try {
        const todos = await Todo.find({user: user.id}).sort({ created: -1 });
        return todos;
      } catch (err) {
        throw new Error(err);
      }
    },

    // Get todo by id
    async getTodo(_, { todoId }, { auth }) {
      const user = await getUser(auth);
      try {
        const todo = await Todo.findOne({ _id:  todoId, user: user.id }).sort({ created: -1 });
        if (todo) {
          return todo;
        } else {
          return 'Todo does not exist'
        }
      } catch (err) {
        throw new Error(err);
      }
    }
  },

  Mutation: {
    // Create a new Todo
    async createTodo(_, { body }, { auth }) {
      const user = await getUser(auth);
      try {
        const newTodo = new Todo({
          body,
          created: new Date().toISOString(),
          username: user.username,
          user: user.id
        });
        const todo = await newTodo.save();
        return todo;
      } catch (err) {
        throw new Error(err);
      }
    },
    // Find the todo by its Id and delete it.
    async deleteTodo(_, { todoId }, { auth }) {
      const user = await getUser(auth);
      try {
        const todo = await Todo.findById(todoId);
        if (todo) {
          await todo.delete();
          return 'Todo deleted!';
        } else {
          return 'Todo does not exist'
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async LoginUser(_, { username, password }) {
      // validateLogin is a simple func that checks for empty fields
      // and return valid = false if any.
      const { errors, valid } = validateLogin(username, password);
      if (!valid) throw new UserInputError('Error', { errors });

      // check if that user already exists.
      const user = await User.findOne({ username });
      if (!user) throw new AuthenticationError('this user is not found!');
      const match = await bcrypt.compare(password, user.password)
      if (match == false) {
        throw new AuthenticationError('wrong password!');
      }
      const token = getToken(user); // generate a token if no errors
      return {
        id: user._id, // set an id
        ...user._doc,
        token
      };
    },


    async RegisterUser( _, { user: { username, password, confirmPassword, email } } ) {
      const { errors, valid } = validateRegister(
        username,
        password,
        confirmPassword,
        email
      );
      if (!valid) throw new UserInputError('Error', { errors });
      const user = await User.findOne({ username });
      if (user) throw new ValidationError('This username is not valid!');
      password = await bcrypt.hash(password, 10); // hashing the password
      const newUser = new User({
        username,
        password,
        email,
        created: new Date().toISOString()
      });
      const res = await newUser.save();
      const token = getToken(res);
      return {
        id: res._id,
        ...res._doc,
        token
      };
    }
  }
};

