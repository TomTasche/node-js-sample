var deferred = require("deferred");
var request = require("request");
var mongoose = require("mongoose");
var cheerio = require("cheerio");

mongoose.connect(process.env.MONGODB_URI);

var trackSchema = {
  name: String,
  title: String,
  artist: String,
  station: String
};

var Track = mongoose.model("Track", trackSchema);

function saveTrack(name, title, artist, station) {
  var future = deferred();

  var track = new Track();
  track.name = name;
  track.title = title;
  track.artist = artist;
  track.station = station;

  console.log("saving track: " + JSON.stringify(track));

  track.save(function(error) {
    if (error) {
      console.log(error);

      future.reject(error);
    } else {
      console.log("saved track " + track.name + " from station " + track.station);

      future.resolve();
    }
  });

  return future.promise;
}

function waitFor(promises) {
  var future = deferred();

  var count = promises.length;
  var countdown = function() {
    count--;

    if (count === 0) {
      future.resolve();
    }
  }

  for (var i = 0; i < promises.length; i++) {
    promises[i].then(countdown).catch(countdown);
  }

  return future.promise;
}

function fetchRadio886() {
  var future = deferred();

  var requestOptions = {
    url: "https://www.radio886.at/player/playlist.php"
  };

  request(requestOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var trackPromises = [];

      var html = cheerio.load(body);
      var listItems = html("li");

      for (var i = 0; i < listItems.length; i++) {
        var element = cheerio(listItems[i]);
        var trackData = element.text();

        var name = "";
        var dataParts = trackData.split(" ");
        for (var j = 1; j < dataParts.length; j++) {
          var part = dataParts[j];
          name += " " + part;
        }
        name = name.trim();

        var station = "886";

        var nameSplit = name.split(" - ");
        if (nameSplit.length > 1) {
          artist = nameSplit[0];
          title = nameSplit[1];
        }

        var trackPromise = saveTrack(name, title, artist, station);
        trackPromises.push(trackPromise);
      }

      var savePromise = waitFor(trackPromises);
      future.resolve(savePromise);
    } else {
      future.reject(error);
    }
  });

  return future.promise;
}

function fetchRadioOe3() {
  var future = deferred();

  var requestOptions = {
    url: "https://oe3meta.orf.at/oe3mdata/WebPlayerFiles/PlayList200.json",
    json: true
  };

  request(requestOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var trackPromises = [];
      for (var i = 0; i < body.length; i++) {
        var trackData = body[i];

        var title = trackData["SongName"];
        var artist = trackData["Artist"];
        var name = artist + " - " + title;
        var station = "OE3";

        var trackPromise = saveTrack(name, title, artist, station);
        trackPromises.push(trackPromise);
      }

      var savePromise = waitFor(trackPromises);
      future.resolve(savePromise);
    } else {
      future.reject(error);
    }
  });

  return future.promise;
}

var radioOe3Promise = fetchRadioOe3();
var radio886Promise = fetchRadio886();

var promise = waitFor([radioOe3Promise, radio886Promise]);
promise.then(function() {
  console.log("exitting!");

  process.exit(0);
});
