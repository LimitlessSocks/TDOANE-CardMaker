define(["react", "react-class", "draw/Group", "draw/Text"],
function Pendulum(React, ReactClass, Group, Text)
{
    let PendulumStyles = {
        Normal: {
            effect: {
                fontFamily: ["Matrix Book", "Spectral", "serif"],

                fontSize: 13,
                textAlign: "justify",

                left: 65,
                top: 389,
                width: 290,
                height: 65,
            },
            blue: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 29,
                top: 416,
                width: 23,
                height: 30
            },
            red: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 368,
                top: 416,
                width: 23,
                height: 30
            }
        },
        Small: {
            effect: {
                fontFamily: ["Matrix Book", "Spectral", "serif"],

                fontSize: 13,
                textAlign: "justify",

                left: 65,
                top: 413,
                width: 290,
                height: 42,
            },
            blue: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 29,
                top: 423,
                width: 23,
                height: 30
            },
            red: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 368,
                top: 423,
                width: 23,
                height: 30
            }
        },
        Large: {
            effect: {
                fontFamily: ["Matrix Book", "Spectral", "serif"],

                fontSize: 13,
                textAlign: "justify",

                left: 65,
                top: 389,
                width: 290,
                height: 81,
            },
            blue: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 29,
                top: 424,
                width: 23,
                height: 30
            },
            red: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 368,
                top: 424,
                width: 23,
                height: 30
            }
        },
        Anime: {
            effect: {
                fontFamily: ["Matrix Book", "Spectral", "serif"],

                fontSize: 13,
                textAlign: "justify",

                left: 65,
                top: 389,
                width: 290,
                height: 65,
            },
            blue: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 17,
                top: 416,
                width: 23,
                height: 30
            },
            red: {
                fontFamily: ["Crimson Text", "serif"],
                fontSize: 28,
                textAlign: "center",
                fontWeight: 600,

                left: 381,
                top: 416,
                width: 23,
                height: 30
            }
        },
    };
	var Pendulum = ReactClass({
		render: function render()
		{
            let boxSize = "Normal";
            if(this.props.variant === "Anime") {
                boxSize = "Anime";
            }
            else if(this.props.boxSizeEnabled) {
                boxSize = this.props.boxSize;
            }
            let effectStyle = PendulumStyles[boxSize];
            let groupElements = [
                React.createElement(
                    Text,
                    {
                        text: this.props.effect,
                        style: effectStyle.effect
                    }
                ),
                React.createElement(
                    Text,
                    {
                        text: this.props.blue,
                        style: effectStyle.blue
                    }
                ),
                React.createElement(
                    Text,
                    {
                        text: this.props.red,
                        style: effectStyle.red
                    }
                )
            ];
            if(this.props.variant === "Anime") {
                groupElements.shift();
            }
			return this.props.enabled ? React.createElement(
				Group,
				{ canvas: this.props.canvas, repaint: this.props.repaint },
                ...groupElements
			) : null;
		}
	});
	Pendulum.displayName = "Pendulum";
	Pendulum.defaultProperties = {
		enabled: false,
		blue: 0,
		red: 0,
		effect: "",
        boxSize: "Normal",
        boxSizeEnabled: false,
	};
	return Pendulum;
});
