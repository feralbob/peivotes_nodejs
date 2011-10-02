var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    jade = require('jade'),
    fs = require('fs'),
    xml2js = require('xml2js'),
    util = require('util');

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var CandidatesSchema = new Schema({
  lastname: String,
  firstname: String,
  party: String,
  fullparty: String,
  pollvotes: Number,
  totalvotes: Number,
  pollleading: {type: Boolean, default: false},
  polllead: Number,
  totalleading: {type: Boolean, default: false},
  totallead: Number,
});

var PollsSchema = new Schema({
  poll: String,
  name: String,
  candidates: [CandidatesSchema],
});
var DistrictSchema = new Schema({
  number: { type: Number, unique: true },
  name: String,
  polls: [PollsSchema],
  candidates: [CandidatesSchema],
});

mongoose.connect('mongodo://localhost/peielectiondb');

mongoose.model('District', DistrictSchema);
var Districts = mongoose.model('District', DistrictSchema);

app.configure(function () {
  app.use(express.logger());
  app.use(express.static(__dirname + '/public'));
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {layout: false});

app.get('/', function (req, res) {
  var query = Districts.find();
  query.sort('number', 1).exec(function (err, districts) {
    res.render('root', {districts: districts});
  });
});

app.get('/xml', function (req, res) {
  parse_results_xml();
  res.send('<pre>Districts saved!\n\n');
});

function sortNumber(a, b) {return a - b;}
function sortNumberDesc(a, b) {return b - a;}
function parse_results_xml() {
  console.log('New data!!! Must clear the old data.');
  Districts.find().remove();
  var parser = new xml2js.Parser();
  fs.readFile(__dirname + '/provincial-results-rss.xml', function(err, data) {
      parser.parseString(data, function (err, result) {
        for (var did=1; did < 28; did++) {
          var district = new Districts();
          district.number = did;
          for (var i=0; i < result['channel']['item'].length; i++) {
            var poll = result['channel']['item'][i];
            if (poll['electionspei:districtnumber'] == did) {
              district.name = poll['electionspei:districtname'];
              district.polls.push({poll: poll['electionspei:poll'], name: poll['electionspei:pollname']});
              var pi = district.polls.length - 1;
              district.candidates = Array();
              var c_pollvotes = Array();
              var c_totalvotes = Array();
              for (var bc=0; bc < poll['electionspei:ballotcount'].length; bc++) {
                var c = poll['electionspei:ballotcount'][bc]['@'];
                c_pollvotes.push(c['pollvotes']);
                c_totalvotes.push(c['totalvotes']);
                var candidate = {
                  lastname: c['lastname'],
                  firstname: c['lastname'],
                  party: c['party'],
                  fullparty: c['fullparty'],
                  pollvotes: c['pollvotes'],
                  totalvotes: c['totalvotes'],
                };
                
                district.polls[pi].candidates.push(candidate);
                delete c['pollvotes'];
                district.candidates.push(candidate);
              }

              c_pollvotes.sort(sortNumberDesc);
              c_totalvotes.sort(sortNumberDesc);

              for (var p=0; p < district.polls.length; p++) {
                var cp_pollvotes = Array();
                for (var c=0; c < district.polls[p].candidates.length; c++) {
                  cp_pollvotes.push(district.polls[p].candidates[c].pollvotes);
                }
                cp_pollvotes.sort(sortNumberDesc);
                for (var c=0; c < district.polls[p].candidates.length; c++) {
                  if (Number(cp_pollvotes[0]) == Number(district.polls[p].candidates[c].pollvotes)) {
                    district.polls[p].candidates[c].polllead = cp_pollvotes[0] - cp_pollvotes[1];
                    district.polls[p].candidates[c].pollleading = true;
                  }
                }
              }

              for (var c=0; c < district.candidates.length; c++) {
                if (c_totalvotes[0] == district.candidates[c].totalvotes) {
                  district.candidates[c].totallead = c_totalvotes[0] - c_totalvotes[1];
                  district.candidates[c].totalleading = true;
                }
              }
            }
          }

          district.save(function(err) {
            if (err) {
              throw err;
            }
            console.log('SAVED > ' + district.id);
          });
          delete district;
        }
      });
  });
}

io.sockets.on('connection', function (socket) {

  socket.on('get_poll', function (data) {
    var dp = JSON.parse(data);
    Districts.findOne({number: dp['district'], 'polls.poll': dp['poll']}, function (err, district) {      
      for (var i=0; i < district.polls.length; i++) {
        if (district.polls[i].poll == dp['poll']) {
          // @TODO replace with readFile() to do async.
          var jadefile = fs.readFileSync('./views/partials/poll.jade');
          var jadetemplate = jade.compile(jadefile);
          var html = jadetemplate({'district': district, 'poll': district.polls[i]});
          socket.emit('poll', html);
        } 
      }
    });
  });

  socket.on('get_district', function (data) {
    var query = Districts.findOne({number: data}, function (err, district) {
      var d_polls = {};
      var d_cans = [];
      for (var i=0; i < district.polls.length; i++) {
        d_polls[district.polls[i].poll] = district.polls[i];
      }
      for (var i=0; i < district.candidates.length; i++) {
        d_cans[district.candidates[i].totalvotes] = district.candidates[i];
      }
      d_cans.reverse();
      var d_cans_obj = {};
      for (var i=0; i < d_cans.length; i++) {
        if (d_cans[i]) {
          d_cans_obj[i] = d_cans[i];
        }
      }
      fs.readFile('./views/partials/district.jade', 'utf8', function (err, data) {
        if (err) throw err;
        var html = jade.compile(data)({'district': district, 'candidates': d_cans_obj, 'polls': d_polls});
        socket.emit('district', html);
      });
    });
  });

  fs.watchFile(__dirname + '/provincial-results-rss.xml', function (curr, prev) {
    console.log('the current mtime is: ' + curr.mtime);
    console.log('the previous mtime was: ' + prev.mtime);
//    parse_results_xml();
    socket.broadcast.emit('updated');
  });

});


app.listen(4000);