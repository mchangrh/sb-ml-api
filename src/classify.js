async function routes(fastify, options) {
  // get
  fastify.all('/classify/get', async function (req, reply) {
    const { uuid, batch, from, to } = req.query;
    const classify = this.mongo.db.collection("classify");
    const aggregate = [{ $match: { type: "classify" }}]
    // videoID
    if (uuid) {
      const result = await classify.findOne({ uuid });
      return reply.send(result);
    }
    if (batch) {
      aggregate.push({ $match: { "batch": batch }});
    }
    if (from) {
      aggregate.push({ $match: { "category": from }});
    }
    if (to) {
      aggregate.push({ $match: { "predicted": to }});
    }
    // finally add select one
    aggregate.push({ $sample: { size: 1 }});
    // random
    const cursor = await classify.aggregate(aggregate);
    const results = await cursor.toArray()
    return (results.length === 0)
      ? reply.code(404).send()
      : reply.send(results[0])
  });
  // done
  fastify.all('/classify/done', async function (req, reply) {
    const classify = this.mongo.db.collection("classify");
    const result = await classify.updateOne(
      { uuid: req.query.uuid },
      [{ $set: { type: "done" }}]
    );
    return reply.send(result);
  })
  // done
  fastify.all('/classify/vip', async function (req, reply) {
    const { discordID, uuid } = req.query;
    const user = Number(discordID) || discordID
    const classify = this.mongo.db.collection("classify");
    const result = await classify.updateOne(
      { uuid },
      [{ $set: {
        type: "done",
        user
      }}]
    );
    return reply.send(result);
  })
  // reject
  fastify.all('/classify/reject', async function (req, reply) {
    const classify = this.mongo.db.collection("classify");
    const result = await classify.updateOne(
      { uuid: req.query.uuid },
      { $set: { type: "rejected" } }
    );
    return reply.send(result);
  })
  // loading
  fastify.all('/classify/load', async function (req, reply) {
    reply.code(410).send("use /load")
  })
  // loading
  fastify.all('/classify/append', async function (req, reply) {
    const sbml = this.mongo.db.collection("classify");
    const suggestion = req.body;
    // try parse json
    try {
      const result = JSON.parse(suggestion);
      const mongoResult = sbml.insertOne({...result, type: "classify" });
      reply.send(mongoResult);
    } catch (err) {
      console.log(err)
    }
  })
  // info
  fastify.all('/classify/info', async function (req, reply) {
    const classify = this.mongo.db.collection("classify");
    const result = {
      total: await classify.countDocuments(),
      classify: await classify.countDocuments({ type: "classify" }),
      done: await classify.countDocuments({ type: "done" }),
      rejected: await classify.countDocuments({ type: "rejected" }),
    }
    return reply.send(result);
  })
  // ignore
  fastify.all('/classify/ignore', async function (req, reply) {
    const classify = this.mongo.db.collection("classify");
    const result = await classify.updateOne(
      { uuid: req.query.uuid },
      { $set: { type: "ignored" } }
    );
    return reply.send(result);
  })
}

module.exports = routes;