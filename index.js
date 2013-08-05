var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server, {
        'log': false
    }),
    fs = require('fs'),
    Agitator = require('./lib/agitator');

var version = 1,
    sockets = {};

var agitator = new Agitator({
    'serialPort': '/dev/tty.usbserial-A6008hrf',
    'debug': false,
    'sockets': sockets
});

app.use("/js", express.static(__dirname + '/web/js'));
app.use("/css", express.static(__dirname + '/web/css'));
app.use(express.bodyParser());

// Web app routes

app.get('/', function(req, res){
    fs.readFile(__dirname + "/web/index.html", "UTF-8", function(err, data){
        res.send(data);
    });
});

// API routes

app.get('/api/v' + version + '/update/:value', function(req, res){
    agitator.update(req.params.value);
    res.send('ok');
});

io.sockets.on('connection', function (socket) {
    sockets[socket.id] = socket;

    socket.on('update', function(data){
        agitator.update(data.value);
    });

    socket.on('disconnect', function(){
        delete sockets[socket.id];
    });
});

agitator.on('ready', function(){
    server.listen(8000);
    agitator.start();
    console.log('listening on 8000');
    agitator.agitate(30*1000);
    setInterval(function(){
        agitator.agitate(30*1000);
    }, 60*60*1000);
});
