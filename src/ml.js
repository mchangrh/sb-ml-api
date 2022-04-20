async function routes(fastify, options) {
  // get
  fastify.all('/ml/get', async function (req, reply) {
    const aggregate = [
      { $match: { type: "missed" }}
    ]
    const { video_id, category, batch } = req.query;
    const sbml = this.mongo.db.collection("sbml");
    // videoID
    if (video_id) {
      const result = await sbml.findOne({ video_id });
      return reply.send(result);
    }
    // category
    if (category) {
      aggregate.push({ $match: {
        "missed.category": (category).toUpperCase()
      }});
    }
    if (batch) {
      aggregate.push({ $match: { "batch": batch }});
    }
    // finally add select one
    aggregate.push({ $sample: { size: 1 }});
    // random
    const cursor = await sbml.aggregate(aggregate);
    const results = await cursor.toArray()
    return (results.length === 0)
      ? reply.code(404).send()
      : reply.send(results[0])
  });
  // done
  fastify.all('/ml/done', async function (req, reply) {
    const sbml = this.mongo.db.collection("sbml");
    const result = await sbml.updateOne(
      { video_id: req.query.video_id },
      [{ $set: { type: "done" }},
        { $unset: "missed" }
      ]
    );
    return reply.send(result);
  })
  // reject
  fastify.all('/ml/reject', async function (req, reply) {
    const sbml = this.mongo.db.collection("sbml");
    const result = await sbml.updateOne(
      { video_id: req.query.video_id },
      { $set: { type: "rejected" } }
    );
    return reply.send(result);
  })
  // loading
  fastify.all('/ml/load', async function (req, reply) {
    reply.code(410).send("use /load")
  })
  // info
  fastify.all('/ml/info', async function (req, reply) {
    const sbml = this.mongo.db.collection("sbml");
    const batch_coll = this.mongo.db.collection("batch")
    const result = {
      total: await sbml.countDocuments(),
      missed: await sbml.countDocuments({ type: "missed" }),
      done: await sbml.countDocuments({ type: "done" }),
      rejected: await sbml.countDocuments({ type: "rejected" }),
      batches: await batch_coll.countDocuments(),
    }
    return reply.send(result);
  })
}

module.exports = routes