async function routes(fastify, options) {
  // get
  fastify.all('/classify/get', async function (req, reply) {
    const { uuid } = req.query;
    const classify = this.mongo.db.collection("classify");
    // videoID
    if (uuid) {
      const result = await classify.findOne({ uuid });
      return reply.send(result);
    }
    // random
    const cursor = await classify.aggregate([
      { $match: { type: "classify" }},
      { $sample: { size: 1 }}
    ]);
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
    const classify = this.mongo.db.collection("classify");
    const result = await classify.updateOne(        
      { uuid },
      [{ $set: {
        type: "done",
        user: discordID
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
  fastify.all('/classify/bulkload', async function (req, reply) {
    const classify = this.mongo.db.collection("classify");
    const bulk = classify.initializeUnorderedBulkOp()
    const suggestArray = req.body.split(/\r?\n/);
    // try parse json
    let jsonErrors = 0;
    for (const suggest of suggestArray) {
      try {
        const result = JSON.parse(suggest);
        bulk.insert({...result, type: "classify" });
      } catch (err) {
        if (err.name === "SyntaxError") jsonErrors++;
      }
    }
    // execute
    let bulkResponse;
    try {
      const rawResponse = await bulk.execute();
      bulkResponse = { ok: rawResponse.ok, inserted: rawResponse.nInserted };
    } catch (err) {
      console.log(err)
      if (err?.result?.result) {
        const rawResponse = err.result.result
        bulkResponse = { ok: rawResponse.ok, code: err.code, inserted: rawResponse.nInserted, writeErrors: rawResponse.writeErrors?.length };
      } else {
        bulkResponse = { ok: false, code: err.code };
      }
    }
    const response = { ...bulkResponse, input: suggestArray.length, jsonErrors };
    reply.send(response);
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
      if (err.name === "SyntaxError") jsonErrors++;
      else console.log(err)
    }
  })
  // info
  fastify.all('/classify/info', async function (req, reply) {
    const classify = this.mongo.db.collection("classify");
    const result = {
      total: await classify.countDocuments(),
      classify: await classify.countDocuments({ type: "load" }),
      done: await classify.countDocuments({ type: "done" }),
      rejected: await classify.countDocuments({ type: "rejected" }),
    }
    return reply.send(result);
  })
}

module.exports = routes;