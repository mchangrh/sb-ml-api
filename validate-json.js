const { readFile } = require("fs").promises;
const validate = async (filename) => {
  const data = await readFile(filename, "utf-8")
  const array = data.split("\n");
  const good = []
  for (const line of array) {
    try {
      const parsed = JSON.parse(line);
      good.push(parsed);
    } catch (err) {
      console.log(err);
      console.log(line)
    }
  }
  console.log("good")
}
validate("./latest_eval.txt")