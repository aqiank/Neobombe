var App = React.createClass({displayName: "App",
	getInitialState: function() {
		return {
			ports: [],
			showStatus: false,
			track: "#neobombe",
			debugMode: false,
		};
	},
	componentDidMount: function() {
		ipc.on("onSerialConnected", function(data) {
			this.onSerialConnected(data.ports);
		}.bind(this));

		ipc.on("onSerialDisconnected", function(data) {
			this.onSerialDisconnected(data.ports);
		}.bind(this));

		ipc.on("onSerialError", function(data) {
			console.log("onSerialError: " + data.err);
		}.bind(this));

		ipc.on("toggleUI", function() {
			this.setState({showStatus: !this.state.showStatus});
		}.bind(this));

		ipc.on("toggleBombe", function() {
			this.refs.home.toggleBombe();
		}.bind(this));

		ipc.on("onTweet", function(tweet) {
			this.refs.home.onTweet(tweet);
		}.bind(this));
	},
	render: function() {
		return (
			React.createElement("div", {className: "app"}, 
				React.createElement(Home, {ref: "home"}), 
				React.createElement(Status, {show: this.state.showStatus, ports: this.state.ports})
			)
		);
	},
	onSerialConnected: function(ports) {
		this.setState({ports: ports});
	},
	onSerialDisconnected: function(ports) {
		this.setState({ports: ports});
	},
});

React.render(React.createElement(App, null), document.getElementById("root"));
