var deferred = require("deferred");
var request = require("request");
var mongoose = require("mongoose");

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

function fetchRadioOe3() {
    var future = deferred();

    var requestOptions = {
        url: "http://oe3meta.orf.at/oe3mdata/WebPlayerFiles/PlayList200.json",
        json: true
    };

    request(requestOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            for (var i = 0; i < body.length; i++) {
                var trackData = body[i];

                var title = trackData["SongName"];
                var artist = trackData["Artist"];
                var name = artist + " - " + title;
                var station = "OE3";

                // TODO: wait for tracks to be saved
                saveTrack(name, title, artist, station);
            }
        } else {
            future.reject(error);
        }
    });

    return future.promise;
}

fetchRadioOe3();
