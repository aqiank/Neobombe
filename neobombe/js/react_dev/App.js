var App = React.createClass({
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
			<div className="app">
				<Home ref="home" />
				{this.state.showStatus ? <Status ports={this.state.ports} /> : ""}
			</div>
		);
	},
	onSerialConnected: function(ports) {
		this.setState({ports: ports});
	},
	onSerialDisconnected: function(ports) {
		this.setState({ports: ports});
	},
});

React.render(<App />, document.getElementById("root"));
