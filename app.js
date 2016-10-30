var finalhandler = require("finalhandler");
var serveStatic = require("serve-static");
var http = require("http");

var serve = serveStatic("public/", {
  index: ["index.html"]
});

var server = http.createServer(function onRequest(req, res) {
  serve(req, res, finalhandler);
});

server.listen(process.env.PORT || 3000);
