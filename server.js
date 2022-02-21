require('dotenv').config();
const Fastify = require('fastify');
const fastify = Fastify({
  bodyLimit: 20971520 // 20MB
});
const mongo = require("mongodb").MongoClient;
let sbml, batch;

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
fastify.all('/get', async (req, reply) => {
  const aggregate = [
    { $match: { type: "missed" }},
    { $sample: { size: 1 }}
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
  // random
  const cursor = await sbml.aggregate(aggregate);
  const results = await cursor.toArray()
  return (results.length === 0)
    ? reply.code(404).send()
    : reply.send(results[0])
});
// done
fastify.all('/done', async (req, reply) => {
  const result = await sbml.updateOne(
    { video_id: req.query.video_id },
    [{ $set: { type: "done" }},
      { $unset: "missed" }
    ]
  );
  return reply.send(result);
})
// reject
fastify.all('/reject', async (req, reply) => {
  const result = await sbml.updateOne(
    { video_id: req.query.video_id },
    { $set: { type: "rejected" } }
  );
  return reply.send(result);
})
// loading
fastify.all('/load', async (req, reply) => {
  const batchID = genID();
  const bulk = sbml.initializeUnorderedBulkOp()
  const suggestArray = req.body.split('\n');
  // try parse json
  let jsonErrors = 0;
  let comment;
  for (const suggest of suggestArray) {
    try {
      if (suggest[0] === "#") comment = suggest;
      const result = JSON.parse(suggest);
      bulk.insert({...result, type: result?.missed?.length ? "missed" : "incorrect", batch: batchID});
    } catch (err) {
      console.log(err.name);
      jsonErrors++;
    }
  }
  // execute
  let bulkResponse;
  try {
    const rawResponse = await bulk.execute();
    bulkResponse = { ok: rawResponse.ok, inserted: rawResponse.nInserted, jsonErrors };
  } catch (err) {
    console.log(err)
    if (err?.result?.result) {
      const rawResponse = err.result.result
      bulkResponse = { ok: rawResponse.ok, code: err.code, inserted: rawResponse.nInserted, jsonErrors, writeErrors: rawResponse.writeErrors?.length };
    } else {
      bulkResponse = { ok: false, code: err.code, jsonErrors };
    }
  }
  const response = { batchID, ...bulkResponse, input: suggestArray.length };
  await batch_coll.insert({
    time: new Date(),
    comment,
    ...response,
  });
  reply.send(response);
})
// info
fastify.all('/info', async (req, reply) => {
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