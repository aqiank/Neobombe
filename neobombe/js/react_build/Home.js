const STATE_STOPPED = 0,
      STATE_FINDING_MESSAGE = 1,
	  STATE_RECEIVED_MESSAGE = 2,
	  STATE_DECRYPTING = 5,
	  STATE_DECRYPTED = 6;

const NUM_UNITS = 36;
const NUM_COMBINATIONS = 26 * 26 * 26;

var Home = React.createClass({displayName: "Home",
	render: function() {
		return (
			React.createElement(Home.Bombe, {ref: "bombe"})
		);
	},
	toggleBombe: function() {
		this.refs.bombe.toggle();
	},
	onTweet: function(tweet) {
		this.refs.bombe.onTweet(tweet);
	},
});

Home.Bombe = React.createClass({displayName: "Bombe",
	track: "#neobombe",
	units: [],
	fetchTweetTimerID: -1,
	decryptTimerID: -1,
	restartTimerID: -1,
	startMotorTimerID: -1,
	getInitialState: function() {
		return {
			state: STATE_STOPPED,
			user: "",
			message: "",
			texts: [],
			debugMode: false,
		};
	},
	componentWillMount: function() {
		for (var i = 0; i < NUM_UNITS; i++) {
			this.units[i] = new Unit(i);
		}
		dispatcher.register(function(payload) {
			switch (payload.type) {
			case "onTrackChanged":
				this.track = payload.track; break;
			case "onDebugModeChanged":
				this.onDebugModeChanged(payload.debugMode); break;
			}
		}.bind(this));
	},
	componentWillUnmount: function() {
		this.onStopped();
		this.units.length = 0;
	},
	render: function() {
		var elem;
		if (this.state.debugMode) {
			elem = React.createElement(Home.Debugging, null);
		} else {
			switch (this.state.state) {
			default:
			case STATE_STOPPED:
				elem = React.createElement(Home.Stopped, null); break;
			case STATE_FINDING_MESSAGE:
				elem = React.createElement(Home.FindingMessage, {track: this.track}); break;
			case STATE_RECEIVED_MESSAGE:
				elem = React.createElement(Home.ReceivedMessage, {user: this.state.user, message: this.state.message}); break;
			case STATE_DECRYPTING:
				elem = React.createElement(Home.Decrypting, {texts: this.state.texts}); break;
			case STATE_DECRYPTED:
				elem = React.createElement(Home.Decrypted, {texts: this.state.texts}); break;
			}
		}
		return (
			React.createElement("div", {className: "stage-wrapper"}, 
				elem
			)
		);
	},
	toggle: function() {
		if (this.state.debugMode) {
			if (!this.state.debugMotorStarted) {
				this.onDebugStarted();
			} else {
				this.onDebugStopped();
			}
		} else {
			var state = this.state.state;
			if (state == STATE_STOPPED) {
				this.onStarted();
			} else {
				this.onStopped();
			}
		}
	},
	encrypt: function(msg) {
		var index = Math.floor(Math.random() * NUM_UNITS);
		var m = this.units[index].enigma;
		return m.encrypt(msg);
		//console.log("Encrypted: " + es.encrypted + " Original: " + es.original);
	},
	decrypt: function(msg, orig) {
		var texts = this.state.texts;

		for (var i = 0; i < this.units.length; i++) {
			var m = clone(this.units[i].enigma);
			var s = m.encrypt(msg).encrypted;
			this.onDecrypting(i, s);
			if (s.indexOf(orig) >= 0) {
				this.onDecrypted(i, s);
				return;
			}
		}
		this.step();

		this.decryptTimerID = setTimeout(this.decrypt, 16, msg, orig);
	},
	step: function() {
		for (var i = 0; i < this.units.length; i++) {
			this.units[i].step();
		}
	},
	requestTweet: function() {
		ipcSend("requestTweet", {track: this.track});
	},
	startMotors: function() {
		ipcSend("startMotors");
	},
	stopMotors: function() {
		ipcSend("stopMotors");
	},
	onTweet: function(tweet) {
		if (this.state.state == STATE_FINDING_MESSAGE) {
			var message = this.encrypt(tweet.text);
			this.setState({state: STATE_RECEIVED_MESSAGE, user: tweet.user.name, message: message.encrypted});
			this.decryptTimerID = setTimeout(this.decrypt, 5000, message.encrypted, message.original);
			this.startMotorTimerID = setTimeout(this.startMotors, 5000);
		}
	},
	onStarted: function() {
		this.setState({state: STATE_FINDING_MESSAGE});
		this.requestTweet();
	},
	onStopped: function() {
		this.setState({state: STATE_STOPPED});

		clearTimeout(this.fetchTweetTimerID);
		clearTimeout(this.decryptTimerID);
		clearTimeout(this.restartTimerID);
		clearTimeout(this.startMotorTimerID);
		this.fetchTweetTimerID = -1;
		this.decryptTimerID = -1;
		this.restartTimerID = -1;
		this.startMotorTimerID = -1;

		this.stopMotors();
	},
	onDecrypting: function(i, msg) {
		var texts = this.state.texts;
		texts[i] = {text: msg, isOriginal: false};
		this.setState({state: STATE_DECRYPTING, texts: texts});
	},
	onDecrypted: function(i, msg) {
		this.stopMotors();
		var texts = this.state.texts;
		texts[i] = {text: msg, isOriginal: true};
		this.setState({state: STATE_DECRYPTED, texts: texts});
		this.restartTimerID = setTimeout(this.onStarted, 20000);
		console.log("Successfully decrypted the message: " + msg);
	},
	onDebugModeChanged: function(debugMode) {
		if (debugMode) {
			this.onStopped();
		} else {
			this.onDebugStopped();
		}
		this.setState({debugMode: debugMode});
	},
	onDebugStarted: function() {
		this.startMotors();
		this.setState({debugMotorStarted: true});
		console.log("debug: starting motors");
	},
	onDebugStopped: function() {
		this.stopMotors();
		this.setState({debugMotorStarted: false});
		console.log("debug: stopped motors");
	},
});

Home.Debugging = React.createClass({displayName: "Debugging",
	render: function() {
		return (
			React.createElement("div", {className: "stage"}, 
				React.createElement("h1", null, "Debugging")
			)
		);
	},
});

Home.Stopped = React.createClass({displayName: "Stopped",
	render: function() {
		return (
			React.createElement("div", {className: "stage"}, 
				React.createElement("h1", null, "Stopped")
			)
		);
	},
});

Home.FindingMessage = React.createClass({displayName: "FindingMessage",
	render: function() {
		return (
			React.createElement("div", {className: "stage"}, 
				React.createElement("h1", null, "WAITING FOR TWEETS FROM ", this.props.track)
			)
		);
	},
});

Home.ReceivedMessage = React.createClass({displayName: "ReceivedMessage",
	render: function() {
		return (
			React.createElement("div", {className: "stage"}, 
				React.createElement("h1", null, "INTERCEPTED A SECRET MESSAGE FROM ", React.createElement("span", {className: "user"}, this.props.user)), 
				React.createElement("p", {className: "message"}, this.props.message)
			)
		);
	},
});

Home.Decrypting = React.createClass({displayName: "Decrypting",
	render: function() {
		return (
			React.createElement("div", {className: "stage"}, 
				React.createElement("h1", null, "DECRYPTING"), 
				React.createElement("div", null, 
					this.textElements()
				)
			)
		);
	},
	textElements: function() {
		return buildElements(this.props.texts, function(i, t) {
			return React.createElement("p", {className: "message"}, t.text);
		});
	},
});

Home.Decrypted = React.createClass({displayName: "Decrypted",
	render: function() {
		return (
			React.createElement("div", {className: "stage"}, 
				React.createElement("h1", null, "DECRYPTED!"), 
				React.createElement("div", null, 
					this.textElements()
				)
			)
		);
	},
	textElements: function() {
		return buildElements(this.props.texts, function(i, t) {
			return React.createElement("p", {className: t.isOriginal ? "message original" : "message"}, t.text)
		});
	},
});
