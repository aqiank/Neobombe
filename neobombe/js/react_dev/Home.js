const STATE_STOPPED = 0,
      STATE_FINDING_MESSAGE = 1,
      STATE_RECEIVED_MESSAGE = 2,
      STATE_DECRYPTING = 5,
      STATE_DECRYPTED = 6;

const NUM_UNITS = 36;
const NUM_COMBINATIONS = 26 * 26 * 26;

var Home = React.createClass({
	render: function() {
		return (
			<Home.Bombe ref="bombe" />
		);
	},
	toggleBombe: function() {
		this.refs.bombe.toggle();
	},
	onTweet: function(tweet) {
		this.refs.bombe.onTweet(tweet);
	},
});

Home.Bombe = React.createClass({
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
			elem = <Home.Debugging />;
		} else {
			switch (this.state.state) {
			default:
			case STATE_STOPPED:
				elem = <Home.Stopped />; break;
			case STATE_FINDING_MESSAGE:
				elem = <Home.FindingMessage track={this.track} />; break;
			case STATE_RECEIVED_MESSAGE:
				elem = <Home.ReceivedMessage user={this.state.user} message={this.state.message} />; break;
			case STATE_DECRYPTING:
				elem = <Home.Decrypting texts={this.state.texts} />; break;
			case STATE_DECRYPTED:
				elem = <Home.Decrypted texts={this.state.texts} />; break;
			}
		}
		return (
			<div className="stage-wrapper">
				{elem}
			</div>
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

Home.Debugging = React.createClass({
	render: function() {
		return (
			<div className="stage">
				<h1>Debugging</h1>
			</div>
		);
	},
});

Home.Stopped = React.createClass({
	render: function() {
		return (
			<div className="stage">
				<h1>Stopped</h1>
			</div>
		);
	},
});

Home.FindingMessage = React.createClass({
	render: function() {
		return (
			<div className="stage">
				<h1>WAITING FOR TWEETS FROM {this.props.track}</h1>
			</div>
		);
	},
});

Home.ReceivedMessage = React.createClass({
	render: function() {
		return (
			<div className="stage">
				<h1>INTERCEPTED A SECRET MESSAGE FROM <span className="user">{this.props.user}</span></h1>
				<p className="message">{this.props.message}</p>
			</div>
		);
	},
});

Home.Decrypting = React.createClass({
	render: function() {
		var texts = this.props.texts;
		return (
			<div className="stage">
				<h1>DECRYPTING</h1>
				<div>{
					texts ? texts.map(function(m) {
						return <p className="message">{t.text}</p>
					}) : ""
				}</div>
			</div>
		);
	},
});

Home.Decrypted = React.createClass({
	render: function() {
		var texts = this.props.texts;
		return (
			<div className="stage">
				<h1>DECRYPTED!</h1>
				<div>{
					texts ? texts.map(function(t) {
						return <p className={t.isOriginal ? "message original" : "message"}>{t.text}</p>
					}) : ""
				}</div>
			</div>
		);
	},
});
