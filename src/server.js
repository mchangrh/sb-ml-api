require('dotenv').config();
const Fastify = require('fastify');
const fastify = Fastify({
  bodyLimit: 20971520 // 20MB
});

fastify.register(require('fastify-mongodb'), {
  // force to close the mongodb connection when app stopped
  forceClose: true,
  url: process.env.MONGO_AUTH
})

// prehook
fastify.addHook('preValidation', (req, reply, done) => {
  if (req.query.auth !== process.env.AUTH) {
    reply.code(403);
    done(new Error("Not authorized"));
  }
  done();
})

// ml functions
fastify.register(require("./ml.js"))
// classify functions
fastify.register(require("./classify.js"))

fastify.all("*", (req, reply) => {
  reply.status(404).send();
})

fastify.listen(process.env.PORT);
console.log("server started on port " + process.env.PORT);