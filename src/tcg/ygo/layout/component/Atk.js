define(["react", "react-class", "draw/Text", "draw/Image"], function Atk(React, ReactClass, Text, Image)
{
	var styles = {
        Normal: {
    		fontFamily: ["Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 16,
    		textAlign: "right",
    		whitespace: "nowrap",
    		fontWeight: 600,

    		left: 263,
    		top: 560,
    		width: 35,
    		height: undefined
    	},
        Anime: {
    		fontFamily: ["YGODIY-Chinese", "Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 46,
    		textAlign: "center",
    		whitespace: "nowrap",
    		fontWeight: 600,

    		left: 53,
    		top: 527,
    		width: 124,
    		height: undefined
    	},
        Rush: {
    		fontFamily: ["Eurostile Candy W01", "Palatino Linotype", "Crimson Text", "serif"],
    		fontSize: 19.25,
    		textAlign: "right",
    		whitespace: "nowrap",
            color: "white",
    		fontWeight: 600,

            strokeColor: "#000000",
            strokeWidth: 3,

    		left: 147,
    		top: 411,
    		width: 75,
    		height: undefined
    	},
        AnimeInfinity: {
            left: 79,
            top: 542,
            width: 72,
            height: 33,
        }
    };
	var Atk = ReactClass({
		render: function render()
		{
            if(this.props.variant === "Anime" && this.props.value === "∞") {
                return React.createElement(Image, {
                    src: "../res/tcg/ygo/text/infinityanime.png",
                    style: styles.AnimeInfinity,
                    repaint: this.props.repaint,
                    canvas: this.props.canvas
                });
            }
            let style = styles[this.props.variant] || styles.Normal;
			return React.createElement(Text, {
                text: this.props.value,
                style: style,
                repaint: this.props.repaint,
                canvas: this.props.canvas
            });
		}
	});

	Atk.displayName = "Atk";
	Atk.defaultProps = {

	}
	return Atk;
});
