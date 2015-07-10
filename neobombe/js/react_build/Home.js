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
	units: [],
	fetchTweetTimerID: -1,
	encryptTimerID: -1,
	decryptTimerID: -1,
	restartTimerID: -1,
	getInitialState: function() {
		return {state: STATE_STOPPED, user: "", texts: []};
	},
	componentWillMount: function() {
		for (var i = 0; i < NUM_UNITS; i++) {
			this.units[i] = new Unit(i);
		}
	},
	componentWillUnmount: function() {
		this.onStopped();
		this.units.length = 0;
	},
	render: function() {
		var elem;
		switch (this.state.state) {
		default:
		case STATE_STOPPED:
			elem = React.createElement(Home.Stopped, null); break;
		case STATE_FINDING_MESSAGE:
			elem = React.createElement(Home.FindingMessage, null); break;
		case STATE_RECEIVED_MESSAGE:
			elem = React.createElement(Home.ReceivedMessage, {user: this.state.user}); break;
		case STATE_DECRYPTING:
			elem = React.createElement(Home.Decrypting, {texts: this.state.texts}); break;
		case STATE_DECRYPTED:
			elem = React.createElement(Home.Decrypted, {texts: this.state.texts}); break;
		}
		return (
			React.createElement("div", {className: "stage-wrapper"}, 
				elem
			)
		);
	},
	toggle: function() {
		var state = this.state.state;
		if (state == STATE_STOPPED) {
			this.onStarted();
		} else {
			this.onStopped();
		}
	},
	encrypt: function(msg) {
		var index = Math.floor(Math.random() * NUM_UNITS);
		var m = this.units[index].enigma;
		var es = m.encrypt(msg);
		console.log("Encrypted: " + es.encrypted + " Original: " + es.original);
		this.onEncrypted(es.encrypted, es.original);
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
		ipcSend("requestTweet", {track: "#DEVIL"});
	},
	onTweet: function(tweet) {
		if (this.state.state == STATE_FINDING_MESSAGE) {
			this.setState({state: STATE_RECEIVED_MESSAGE, user: tweet.user.name});
			this.encryptTimerID = setTimeout(this.encrypt, 5000, tweet.text);
		}
	},
	onStarted: function() {
		this.setState({state: STATE_FINDING_MESSAGE});
		this.requestTweet();
	},
	onStopped: function() {
		this.setState({state: STATE_STOPPED});

		clearTimeout(this.fetchTweetTimerID);
		clearTimeout(this.encryptTimerID);
		clearTimeout(this.decryptTimerID);
		clearTimeout(this.restartTimerID);
		this.fetchTweetTimerID = -1;
		this.encryptTimerID = -1;
		this.decryptTimerID = -1;
		this.restartTimerID = -1;

		this.stopMotors();
	},
	onEncrypted: function(msg, orig) {
		this.decrypt(msg, orig);
	},
	onDecrypting: function(i, msg) {
		this.startMotors();
		var texts = this.state.texts;
		texts[i] = {text: msg, isOriginal: false};
		this.setState({state: STATE_DECRYPTING, texts: texts});
	},
	onDecrypted: function(i, msg) {
		this.stopMotors();
		var texts = this.state.texts;
		texts[i] = {text: msg, isOriginal: true};
		this.setState({state: STATE_DECRYPTED, texts: texts});
		this.restartTimerID = setTimeout(this.onStarted, 10000);
		console.log("Successfully decrypted the message: " + msg);
	},
	startMotors: function() {
		ipcSend("startMotors");
	},
	stopMotors: function() {
		ipcSend("stopMotors");
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
				React.createElement("h1", null, "WAITING FOR A SECRET MESSAGE")
			)
		);
	},
});

Home.ReceivedMessage = React.createClass({displayName: "ReceivedMessage",
	render: function() {
		return (
			React.createElement("div", {className: "stage"}, 
				React.createElement("h1", null, "INTERCEPTED A MESSAGE FROM ", React.createElement("span", {className: "user"}, this.props.user))
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
