var finalhandler = require("finalhandler");
var serveStatic = require("serve-static");
var http = require("http");
var url = require("url");

var mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

var trackSchema = {
  name: String,
  title: String,
  artist: String,
  station: String
};

var Track = mongoose.model("Track", trackSchema);

var serve = serveStatic("public/", {
  index: ["index.html"]
});

var server = http.createServer(function onRequest(request, response) {
  var requestUrl = url.parse(request.url, true);

  if ("/tracks" === requestUrl.pathname) {
    var station = requestUrl.query.station;

    var query = Track.find({
      station: station
    });
    query.limit(10);
    query.exec(function(error, tracks) {
      response.end(JSON.stringify(tracks));
    });
  } else {
    serve(request, response, finalhandler);
  }
});

server.listen(process.env.PORT || 3000);
