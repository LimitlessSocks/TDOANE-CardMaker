define(["react", "react-class", "draw/Text"], function Copyright(React, ReactClass, Text)
{
	var Copyright = ReactClass({
		render: function render()
		{
			return React.createElement(Text, { text: this.props.value, style: {
                color: this.props.color,
                // fontSize: 17,
                fontSize: 12,
				fontFamily: ["Stone Serif", "Papyrus"],
				textAlign: "right",
				whitespace: "nowrap",

                left: 230,
				top: 587,
				width: 150,
				// left: 200,
				// top: 584,
				// width: 200,
				height: 14
			}, canvas: this.props.canvas, repaint: this.props.repaint});
		}
	});
	Copyright.displayName = "Copyright";
	Copyright.defaultProps = {
		value: "",
		color: "black"
	};
	return Copyright;
});
