define(["react", "react-class", "draw/Text"], function Serial(React, ReactClass, Text)
{
    let shared = {
        fontFamily: ["Stone Serif", "Matrix Book", "Spectral", "serif"],
        fontSize: 12,
        textAlign: "left",
        whitespace: "nowrap",
        height: undefined
    }
    let styles ={
        Normal: {
            left: 18,
            top: 587,
            width: 150,
        },
        Rush: {
            left: 23,
            top: 577,
            width: 133,
            color: "white",
        }
    };
	var Serial = ReactClass({
		render: function render()
		{
            let style = {
                color: this.props.color
            };
            Object.assign(style, shared, styles[this.props.variant] || styles.Normal);
			return React.createElement(Text, {
                text: this.props.value,
                style: style,
                canvas: this.props.canvas,
                repaint: this.props.repaint
            });
		}
	});
	Serial.displayName = "Serial";
	Serial.defaultProps = {
		value: "",
		color: "black"
	};
	return Serial;
});
