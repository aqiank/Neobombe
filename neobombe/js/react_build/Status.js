const TOP = 0,
      MIDDLE = 1,
	  BOTTOM = 2;

var Status = React.createClass({displayName: "Status",
	getInitialState: function() {
		return {startedMotors: false};
	},
	render: function() {
		return (
			React.createElement("div", {className: "status-wrapper", style: this.props.show ? {display: "table"} : {display: "none"}}, 
				React.createElement("div", {className: "status"}, 
					React.createElement("div", {className: "row"}, 
						React.createElement("h4", null, "Top"), 
						this.portElements(TOP)
					), 
					React.createElement("div", {className: "row"}, 
						React.createElement("h4", null, "Middle"), 
						this.portElements(MIDDLE)
					), 
					React.createElement("div", {className: "row"}, 
						React.createElement("h4", null, "Bottom"), 
						this.portElements(BOTTOM)
					), 
					React.createElement("div", {className: "row"}, 
						React.createElement("div", {className: "input-field"}, 
							React.createElement("label", {htmlFor: "track"}, "Track"), 
							React.createElement("input", {id: "track", type: "text", onChange: this.onTrackChanged, defaultValue: "#neobombe"})
						), 
						React.createElement("div", {className: "input-field"}, 
							React.createElement("label", {htmlFor: "debug"}, "Debug Mode"), 
							React.createElement("input", {id: "debug", type: "checkbox", onChange: this.onDebugModeChanged, defaultValue: false})
						)
					)
				)
			)
		);
	},
	portElements: function(type) {
		var ports = this.props.ports;
		return ports ? ports.map(function(p) {
			if (p.type == type) {
				return React.createElement("p", {className: "port", key: p.comName}, p.comName)
			}
			return null;
		}) : ""
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
