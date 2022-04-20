require('dotenv').config();
const Fastify = require('fastify');
const fastify = Fastify({
  bodyLimit: 20971520 // 20MB
});

// taken from cfkv-bin
const SYMBOLS = '23456789abcdefhjkprstxyzABCDEFGHJKMNPQRSTXYZ'
const genID = (len = 5) => {
  let result = ''
  for (let i = 0; i < len; i++) result += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  return result
}

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

// loading
fastify.all('/load', async function (req, reply) {
  const batch = genID();
  const sbml = this.mongo.db.collection("sbml");
  const classify = this.mongo.db.collection("classify")
  const batch_coll = this.mongo.db.collection("batch")
  const sbml_bulk = sbml.initializeUnorderedBulkOp()
  const classify_bulk = classify.initializeUnorderedBulkOp()
  const suggestArray = req.body.split(/\r?\n/);
  // try parse json
  let jsonErrors = 0;
  let underThreshold = 0;
  let comment;
  for (const suggest of suggestArray) {
    try {
      // parse comment
      if (suggest[0] === "#") comment = suggest;
      // parse segment
      const result = JSON.parse(suggest);
      // seperate into classify/ missed
      const video_id = result.video_id;
      if (result?.missed) {
        const missedEntry = {
          ...result,
          type: "missed",
          batch
        }
        delete missedEntry.incorrect;
        const preFilter = missedEntry.missed?.length
        missedEntry.missed = missedEntry.missed.filter(x => x.probability >= 0.8)
        underThreshold += preFilter - missedEntry.missed?.length;
        sbml_bulk.insert(missedEntry);
      } else if (result?.incorrect) {
        for (const entry of result.incorrect) {
          const incorrectEntry = {
            video_id,
            type: "classify",
            batch,
            ...entry
          }
          classify_bulk.insert(incorrectEntry);
        }
      }
    } catch (err) {
      if (err.name === "SyntaxError") jsonErrors++;
      else console.log(err)
    }
  }
  // execute
  let sbml_bulk_response, classify_bulk_response;
  try {
    const sbml_raw = await sbml_bulk.execute();
    sbml_bulk_response = { ok: sbml_raw.ok, inserted: sbml_raw.nInserted };
  } catch (err) {
    console.log(err)
    if (err?.result?.result) {
      const sbml_raw = err.result.result
      sbml_bulk_response = { ok: sbml_raw.ok, code: err.code, inserted: sbml_raw.nInserted, underThreshold, writeErrors: sbml_raw.writeErrors?.length };
    } else {
      sbml_bulk_response = { ok: false, code: err.code, underThreshold };
    }
  }
  try {
    const classify_raw = await classify_bulk.execute();
    classify_bulk_response = { ok: classify_raw.ok, inserted: classify_raw.nInserted };
  } catch (err) {
    console.log(err)
    if (err?.result?.result) {
      const classify_raw = err.result.result
      classify_bulk_response = { ok: classify_raw.ok, code: err.code, inserted: classify_raw.nInserted, writeErrors: classify_raw.writeErrors?.length };
    } else {
      classify_bulk_response = { ok: false, code: err.code };
    }
  }
  const response = { batchID: batch, sbml: sbml_bulk_response, classify: classify_bulk_response, input: suggestArray.length, jsonErrors };
  await batch_coll.insertOne({
    time: new Date(),
    comment,
    ...response,
  });
  reply.send(response);
})

fastify.all("*", (req, reply) => {
  reply.status(404).send();
})

fastify.listen(process.env.PORT);
console.log("server started on port " + process.env.PORT);