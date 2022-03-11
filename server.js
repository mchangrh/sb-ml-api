require('dotenv').config();
const Fastify = require('fastify');
const fastify = Fastify({
  bodyLimit: 20971520 // 20MB
});
const mongo = require("mongodb").MongoClient;
let sbml, batch_coll;

// taken from cfkv-bin
const SYMBOLS = '23456789abcdefhjkprstxyzABCDEFGHJKMNPQRSTXYZ'
const genID = (len = 5) => {
  let result = ''
  for (let i = 0; i < len; i++) result += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  return result
}

// mongodb setup
mongo.connect(
  process.env.MONGO_AUTH, (err, client) => {
    if (err) {
      console.error(err);
      return;
    };
    const db = client.db("sb-slash");
    sbml = db.collection("sbml");
    batch_coll = db.collection("batch");
  }
)
// prehook
fastify.addHook('preValidation', (req, reply, done) => {
  if (req.query.auth !== process.env.AUTH) {
    reply.code(403);
    done(new Error("Not authorized"));
  }
  done();
})
// get
fastify.all('/ml/get', async (req, reply) => {
  const aggregate = [
    { $match: { type: "missed" }}
  ]
  const { video_id, category, batch } = req.query;
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
fastify.all('/ml/done', async (req, reply) => {
  const result = await sbml.updateOne(
    { video_id: req.query.video_id },
    [{ $set: { type: "done" }},
      { $unset: "missed" }
    ]
  );
  return reply.send(result);
})
// reject
fastify.all('/ml/reject', async (req, reply) => {
  const result = await sbml.updateOne(
    { video_id: req.query.video_id },
    { $set: { type: "rejected" } }
  );
  return reply.send(result);
})
// loading
fastify.all('/ml/load', async (req, reply) => {
  const batchID = genID();
  const bulk = sbml.initializeUnorderedBulkOp()
  const suggestArray = req.body.split(/\r?\n/);
  // try parse json
  let jsonErrors = 0;
  let underThreshold = 0;
  let comment;
  for (const suggest of suggestArray) {
    try {
      if (suggest[0] === "#") comment = suggest;
      let result = JSON.parse(suggest);
      const preFilter = result?.missed?.length
      result.missed = result?.missed.filter(x => x.probability >= 0.8)
      underThreshold += preFilter - result?.missed?.length;
      if (!result?.missed?.length && !result?.incorrect?.length) continue
      bulk.insert({...result, type: result?.missed?.length ? "missed" : "incorrect", batch: batchID});
    } catch (err) {
      if (err.name === "SyntaxError") jsonErrors++;
      else console.log(err)
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
      bulkResponse = { ok: rawResponse.ok, code: err.code, inserted: rawResponse.nInserted, underThreshold, writeErrors: rawResponse.writeErrors?.length };
    } else {
      bulkResponse = { ok: false, code: err.code, underThreshold };
    }
  }
  const response = { batchID, ...bulkResponse, input: suggestArray.length, jsonErrors };
  await batch_coll.insertOne({
    time: new Date(),
    comment,
    ...response,
  });
  reply.send(response);
})
// info
fastify.all('/ml/info', async (req, reply) => {
  const result = {
    total: await sbml.countDocuments(),
    missed: await sbml.countDocuments({ type: "missed" }),
    incorrect: await sbml.countDocuments({ type: "incorrect" }),
    done: await sbml.countDocuments({ type: "done" }),
    rejected: await sbml.countDocuments({ type: "rejected" }),
    batches: await batch_coll.countDocuments(),
  }
  return reply.send(result);
})
fastify.all("*", (req, reply) => {
  reply.status(404).send();
})

fastify.listen(process.env.PORT);
console.log("server started on port " + process.env.PORT);