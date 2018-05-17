(function() {
  var evl;

  evl = function(s) {
    return s;
  };

  if (process.argv.length > 2) {
    console.log(evl(process.argv[2]));
  }
})();
