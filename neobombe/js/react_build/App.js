var App = React.createClass({displayName: "App",
	getInitialState: function() {
		return {
			ports: [],
			showStatus: false,
		};
	},
	componentDidMount: function() {
		ipcOn("onSerialConnected", function(data) {
			this.onSerialConnected(data.ports);
		}.bind(this));

		ipcOn("onSerialDisconnected", function(data) {
			this.onSerialDisconnected(data.ports);
		}.bind(this));

		ipcOn("onSerialError", function(data) {
			console.log("onSerialError: " + data.err);
		}.bind(this));

		ipcOn("toggleUI", function() {
			this.setState({showStatus: !this.state.showStatus});
		}.bind(this));

		ipcOn("toggleBombe", function() {
			this.refs.home.toggleBombe();
		}.bind(this));

		ipcOn("onTweet", function(tweet) {
			this.refs.home.onTweet(tweet);
		}.bind(this));
	},
	render: function() {
		return (
			React.createElement("div", {className: "app"}, 
				React.createElement(Home, {ref: "home"}), 
				this.state.showStatus ? React.createElement(Status, {ports: this.state.ports}) : ""
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
