var Status = React.createClass({
	render: function() {
		return (
			<div className="status-wrapper">
				<div className="status">
					<div className="row">
						<h4>Top</h4>
						{this.portElements(0)}
					</div>
					<div className="row">
						<h4>Middle</h4>
						{this.portElements(1)}
					</div>
					<div className="row">
						<h4>Bottom</h4>
						{this.portElements(2)}
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
	}
});
