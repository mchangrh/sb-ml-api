const fs = require("fs").promises;
const path = require("path");

const load = async (url) => {
  let junkSuggestions = "";
  for (i=0; i<1000; i++) {
    const appendObj = {
      video_id: "test_2" + i,
      missed: [{
        "start": 0,
        "end": 0,
        "category": "test",
        "probability": 0,
        "text": null
      }],
      type: "test"
    }
    junkSuggestions+=JSON.stringify(appendObj) + "\n";
  }
  await fs.writeFile(path.join(__dirname, "junk.json"), junkSuggestions);
};
load();