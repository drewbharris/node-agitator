var when = require('when'),
    util = require('util'),
    events = require('events'),
    serialport = require('serialport'),
    SerialPort = serialport.SerialPort;

var Agitator = function(opts){
    this.value = 0;
    this.sockets = opts.sockets;
    this.debug = opts.debug;
    this.frameInterval = null;
    this.framerate = 30;
    this.relay = null;

    this.arduino = new SerialPort(opts.serialPort, {
        parser: serialport.parsers.readline("\n"),
        baudRate: 115200,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
    });

    if (this.debug){
        if (process.env.DEVICE === 'arduino'){
            this.arduino.on('data', function(data){
                console.log("From Arduino: " + data);
            });
        }
    }

    if (process.env.DEVICE === 'arduino'){
        this.arduino.on('open', function(){
            this.emit('ready');
        }.bind(this));
    }
    else {
        setTimeout(function(){
            this.emit('ready');
        }.bind(this), 100);
    }

    this.getValue = function(){
        return this.value;
    };

    this.setValue = function(value){
        this.value = value;
    };

};
util.inherits(Agitator, events.EventEmitter);

// the idea here is that we're only writing data at a certain FPS
// this should fix the data overload problem
Agitator.prototype.start = function(){
    this.frameInterval = setInterval(function(){
        // @todo implement promise here, not sure it matters
        this.writeToArduino(this.getValue());
        this.writeToSockets(this.getValue());
    }.bind(this), (1000/this.framerate));
};

Agitator.prototype.writeToSockets = function(data){
    Object.keys(this.sockets).map(function(id){
        this.sockets[id].emit('data', {
            'value': data
        });
    }.bind(this));
};

Agitator.prototype.writeToArduino = function(data){
    var d = when.defer();

    this.arduino.write('[' +
        data + ',0,0,0]\n',
        function(err, resp){
            return d.resolve(this.getValue());
    }.bind(this));

    return d.promise;
};

Agitator.prototype.update = function(newValue){
    this.setValue(newValue);
    console.log("value is " + newValue);
};

Agitator.prototype.agitate = function(length){
    var self = this;
    this.update(80);
    setTimeout(function(){
        self.update(50);
    }, 3000);
    setTimeout(function(){
        self.update(0);
    }, length);
}

module.exports = Agitator;