define(["react", "react-class", "draw/Text"], function Effect(React, ReactClass, Text)
{
	var styles = {
		Monster: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 478,
			width: 360,
			height: 75
		},
		Backrow: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 461,
			width: 360,
			height: 110
		},
        LargePendulumMonster: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 494,
			width: 360,
			height: 65,
        },
		Vanilla: {
			fontFamily: ["Stone Serif Italic", "Amiri", "serif"],
			fontStyle: "italic",
            fontWeight: 400,
			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 478,
			width: 360,
			height: 75
		},
        LargePendulumVanilla: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 494,
			width: 360,
			height: 65,
        },

		Skill: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 478,
			width: 360,
			height: 95
		},
        RushMonster: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 466,
			width: 360,
			height: 103,
        },
        // RushBackrow is the same as RushMonster
        RushBackrow: {
			fontFamily: ["Matrix Book", "Spectral", "serif"],

			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 466,
			width: 360,
			height: 103,
        },
        RushVanilla: {
			fontFamily: ["Stone Serif Italic", "Amiri", "serif"],
			fontStyle: "italic",
            fontWeight: 400,
			fontSize: 18,
			textAlign: "justify",

			left: 30,
			top: 466,
			width: 360,
			height: 103,
        },
	}

	var Effect = ReactClass({
		render: function render()
		{
			return React.createElement(
				Text,
				{
					text: this.props.value,
					style: Object.assign({}, styles[this.props.type]),
					repaint: this.props.repaint,
					canvas: this.props.canvas
				}
			);
		}
	});
	Effect.displayName = "Effect";
	Effect.defaultProps = {
		value: "",
		// Affects the positioning; backrow gets more room since it does not have
		// to accomodate for the ATK / DEF values among other things.
		// Pendulum effects are slightly tighter.
		type: "Monster",
		flavour: false,
	};
	return Effect;
});
