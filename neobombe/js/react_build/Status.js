var Status = React.createClass({displayName: "Status",
	render: function() {
		return (
			React.createElement("div", {className: "status-wrapper"}, 
				React.createElement("div", {className: "status"}, 
					React.createElement("div", {className: "row"}, 
						React.createElement("h4", null, "Top"), 
						this.portElements(0)
					), 
					React.createElement("div", {className: "row"}, 
						React.createElement("h4", null, "Middle"), 
						this.portElements(1)
					), 
					React.createElement("div", {className: "row"}, 
						React.createElement("h4", null, "Bottom"), 
						this.portElements(2)
					)
				)
			)
		);
	},
	portElements: function(type) {
		return buildElements(this.props.ports, function(i, p) {
			if (p.type == type) {
				return React.createElement("p", {className: "port", key: p.comName}, p.comName)
			}
			return null;
		});
	}
});
