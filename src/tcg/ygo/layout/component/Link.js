define(["react", "react-class", "draw/Text"], function Link(React, ReactClass, Text)
{
	var style = {
		fontFamily: ["IDroid", "Audiowide", "sans-serif"],
		fontSize: 16,
		textAlign: "right",
		whitespace: "nowrap",
        fontWeight: "200",

		left: 365,
		top: 560,
		width: 20,
		height: undefined
	};

	var Link = ReactClass({
		render: function render()
		{
			return React.createElement(Text, {
                text: this.props.value,
                style: style,
                repaint: this.props.repaint,
                canvas: this.props.canvas
            });
		}
	});

	Link.displayName = "Link";
	Link.defaultProps = {

	}
	return Link;
});
