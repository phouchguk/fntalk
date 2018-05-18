const lt = require("./lt.js");

if (process.argv.length > 2) {
  console.log(lt.evl(process.argv[2]));
}
