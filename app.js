var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    jade = require('jade'),
    fs = require('fs');

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var CandidatesSchema = new Schema({
  lastname: String,
  firstname: String,
  party: String,
  fullparty: String,
  votes: Number,
});

var PollsSchema = new Schema({
  number: Number,
  name: String,
  candidates: [CandidatesSchema],
});
var DistrictSchema = new Schema({
  number: { type: Number, unique: true },
  name: String,
  description: String,
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
  Districts.find({}, function (err, districts) {
    res.render('root', {districts: districts});
  });
});

io.sockets.on('connection', function (socket) {

  socket.on('get_poll', function (data) {
    var dp = JSON.parse(data);
    console.log("Data received from client, decoded:");
    console.log(dp);

    Districts.findOne({number: dp['district'], 'polls.number': dp['poll']}, function (err, district) {
      console.log('DISTRICT');
      console.log(district);
      fs.readFile('./views/partials/poll.jade', 'utf8', function (err, data) {
        if (err) throw err;
        console.log('Sending poll to jade:');
        console.log(district);
        var html = jade.compile(data)({'poll': polls[0]});
        console.log(html);
        socket.emit('poll', html);
      });
    });
  });

  socket.on('get_district', function (data) {
    Districts.findOne({number: data}, function (err, district) {
      fs.readFile('./views/partials/district.jade', 'utf8', function (err, data) {
        if (err) throw err;
        var html = jade.compile(data)({'district': district});
        socket.emit('district', html);
      });
    });
  });

});

app.listen(4000);






function create_district() {
  var district = new Districts();
  district.number = 1;
  district.name = 'Souris - Elmira';
  district.description = 'Commencing at East Point and bounded on the north by the Gulf of St. Lawrence; thence westwardly to a point on the shore of the Gulf of St. Lawrence where it intersects with township line # 42; thence southwardly along said township line to the Church Road; thence westwardly along said road to the Selkirk Road (Route # 309); thence southwardly along said road to Route # 2; thence westwardly along said road to the Dundas Road (Route # 4); thence southwardly along said road to township line # 55; thence southwardly along said township line to the Little River Road (Route # 314); thence eastwardly along said road and the Grove Pine Road to Route # 310; thence northwardly to the center of Little River; thence eastwardly along said river to Howe Bay; thence following said bay to Northumberland Strait; thence eastwardly along said strait to the point of commencement.';


  var lib = {lastname: 'CAMPBELL', firstname: 'ALLAN', party: 'LIB', fullparty: 'Liberal Party of PEI', votes: 50};
  var pc = {lastname: 'LAVIE', firstname: 'COLIN', party: 'PC', fullparty: 'PC Party of PEI', votes: 20};
  district.candidates.push(lib);
  district.candidates.push(pc);

  district.polls.push({number: 1, name: 'North Lake'});
  district.polls[0].candidates.push(lib);
  district.polls[0].candidates.push(pc);
  district.polls.push({number: 2, name: 'Red Point'});
  district.polls.push({number: 3, name: 'Chepstow'});


  district.save(function(err) {
    if (err) {
      throw err;
    }
    console.log('SAVED > ' + district.id);
    mongoose.disconnect();
  });
}

//create_district();