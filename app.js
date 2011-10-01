var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    jade = require('jade'),
    fs = require('fs');

app.configure(function () {
  app.use(express.logger());
  app.use(express.static(__dirname + '/public'));
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {layout: false});

app.get('/', function (req, res) {
  res.render('root');
//  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
  socket.on('get_poll', function (data) {
    console.log("Data received from client:");
    console.log(data);

    var poll = {'id': data}
    
    
    
    
    fs.readFile('./views/poll.jade', 'utf8', function (err, data) {
      if (err) throw err;
      console.log('read the file, moving on');
      var html = jade.compile(data)({'poll': poll});
      console.log(html);
      socket.emit('poll', html);
    });
  });
});

app.listen(4000);