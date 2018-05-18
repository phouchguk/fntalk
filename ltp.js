/* globals console, process, require */

var data, lt, stdin;

lt = require("./lt.js");
stdin = process.openStdin();

data = "";

stdin.on("data", function(chunk) {
  data += chunk;
});

stdin.on("end", function() {
  console.log(lt.evl(data));
});
