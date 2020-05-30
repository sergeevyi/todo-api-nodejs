const { ApolloServer } = require('apollo-server');
const mongoose = require('mongoose');

MONGODB = "mongodb://localhost:27017/todo"
PORT = process.env.PORT || 5000

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const auth = req.headers.authorization || '';
    return {
      auth
    };
  }
});

mongoose
  .connect(MONGODB, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    console.log('MongoDB is connected ...');
    return server.listen({
      port: PORT
    });
  })
  .then(res => {
    console.log('Server running at ', res.url);
  });

