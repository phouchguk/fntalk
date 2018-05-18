const lt = require("./lt.js");
const stdin = process.openStdin();

var data = "";

stdin.on("data", function(chunk) {
  data += chunk;
});

stdin.on("end", function() {
  console.log(lt.evl(data));
});
