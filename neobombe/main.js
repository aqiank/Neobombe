var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var globalShortcut = require('global-shortcut');
var ipc = require('ipc');

// Serial Port
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var ports = [];

// Twitter
var Twitter = require("twitter");
var client = new Twitter({
	consumer_key: "7fP3OpwGZcGq9qvpTmxuibh1t",
	consumer_secret: "hLF1pjRxCsRymtoU5t0UGI7EQ0CYiH2ckJbqwciRyJ1LOvn0gj",
	access_token_key: "7483012-P6HWNPoUORm4uPyOEqJP6yzfb7sPcVtJEiro2bk2cU",
	access_token_secret: "JNoA22H6nSszs3HiBAYAdU0joUFE3Pyq3DPJm5F52Np10",
});

// Report crashes to Electron server.
require('crash-reporter').start();

var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});

app.on('ready', function() {
	mainWindow = new BrowserWindow({width: 800, height: 600, "auto-hide-menu-bar": true});
	mainWindow.loadUrl('file://' + __dirname + '/index.html');
	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	mainWindow.openDevTools();

	// Toggle Bombe (start/stop)
	globalShortcut.register("1", function() {
		mainWindow.webContents.send("toggleBombe");
	});

	// Toggle between Home and Status page
	globalShortcut.register("2", function() {
		mainWindow.webContents.send("toggleUI");
	});

	// Fetch new tweet when requested
	ipc.on("requestTweet", function(event, data) {
		client.stream("statuses/filter", {track: data.track}, function(stream) {
			stream.on("data", function(tweet) {
				mainWindow.webContents.send("onTweet", tweet);
				stream.destroy();
			});
			stream.on("error", function(error) {
				console.log(error);
				//throw error;
			});
		});
	});

	// Handle starting motors
	ipc.on("startMotors", function(event, data) {
		for (var i = 0; i < ports.length; i++) {
			ports[i].write([65], function(error) {
				// Do nothing
			});
		}
	});

	// Handle stopping motors
	ipc.on("stopMotors", function(event, data) {
		for (var i = 0; i < ports.length; i++) {
			ports[i].write([66], function(error) {
				// Do nothing
			});
		}
	});

	// Give one second before finding serial ports
	setTimeout(findSerialPorts, 1000);
});

// Check for Arduino serial port connection or disconnection in one-second interval.
function findSerialPorts() {
	serialport.list(function(err, ports) {
		if (!ports) {
			return;
		}
		ports.forEach(function(port) {
			// Ignore ports without manufacturer
			if (!port.manufacturer) {
				return;
			}

			// Ignore ports without Arduino as the manufacturer or if it's already connected
			if (port.manufacturer.indexOf("Arduino") < 0 || alreadyConnected(port)) {
				return;
			}

			var sp = new SerialPort(port.comName, {
				baudRate: 9600,
				disconnectedCallback: function() {
					onSerialDisconnected(sp);
				},
			}, false);

			sp.open(function(err) {
				if (err) {
					onSerialError(sp, err);
				}
			});

			sp.on("data", function(data) {
				if (!data) {
					return;
				}
				sp.comName = port.comName;
				sp.type = data[0];
				onSerialConnected(sp);
			});
		});
	});

	setTimeout(findSerialPorts, 1000);
}

function onSerialConnected(port) {
	for (var i = 0; i < ports.length; i++) {
		if (port.comName == ports[i].comName) {
			return;
		}
	}

	ports.push(port);
	ipc.send("onSerialConnected", {ports: ports, port: port});
	console.log("Serial port " + port.comName + " connected");
}

function onSerialDisconnected(port) {
	for (var i = 0; i < ports.length; i++) {
		if (ports[i].comName == port.comName) {
			ports.splice(i, 1);
			ipc.send("onSerialDisconnected", {ports: ports, port: port});
			console.log("Serial port " + port.comName + " disconnected");
		}
	}
}

function onSerialError(port, err) {
	ipc.send("onSerialError", {port: port, err: err});
}

function alreadyConnected(port) {
	for (var i = 0; i < ports.length; i++) {
		if (ports[i].comName == port.comName) {
			return true;
		}
	}
	return false;
}
