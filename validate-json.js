const { readFile } = require("fs").promises;
const validate = async (filename) => {
  const data = await readFile(filename, "utf-8")
  const array = data.split(/\r?\n/);
  let good = 0
  for (const line of array) {
    try {
      let parsed = JSON.parse(line.trim());
      good++
    } catch (err) {
      console.log(err);
      console.log(line)
    }
  }
  console.log("good")
  console.log(good)
}
validate("./latest_eval.txt")