const TOP = 0,
      MIDDLE = 1,
	  BOTTOM = 2;

var Status = React.createClass({
	getInitialState: function() {
		return {startedMotors: false};
	},
	render: function() {
		return (
			<div className="status-wrapper" style={this.props.show ? {display: "table"} : {display: "none"}}>
				<div className="status">
					<div className="row">
						<h4>Top</h4>
						{this.portElements(TOP)}
					</div>
					<div className="row">
						<h4>Middle</h4>
						{this.portElements(MIDDLE)}
					</div>
					<div className="row">
						<h4>Bottom</h4>
						{this.portElements(BOTTOM)}
					</div>
					<div className="row">
						<div className="input-field">
							<label htmlFor="track">Track</label>
							<input id="track" type="text" onChange={this.onTrackChanged} defaultValue={"#neobombe"} />
						</div>
						<div className="input-field">
							<label htmlFor="debug">Debug Mode</label>
							<input id="debug" type="checkbox" onChange={this.onDebugModeChanged} defaultValue={false} />
						</div>
					</div>
				</div>
			</div>
		);
	},
	portElements: function(type) {
		return buildElements(this.props.ports, function(i, p) {
			if (p.type == type) {
				return <p className="port" key={p.comName}>{p.comName}</p>
			}
			return null;
		});
	},
	onTrackChanged: function(e) {
		dispatcher.dispatch({
			type: "onTrackChanged",
			track: e.target.value,
		});
	},
	onDebugModeChanged: function(e) {
		if (!e.target.checked) {
			this.setState({startedMotors: false});
		}
		dispatcher.dispatch({
			type: "onDebugModeChanged",
			debugMode: e.target.checked,
		});
	},
});
