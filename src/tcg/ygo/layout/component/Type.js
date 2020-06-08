define(["react", "react-class", "draw/Group", "draw/Image", "draw/Text", "../../Icons", "../../Resources"],
function Type(React, ReactClass, Group, Image, Text, Icons, resources) {
    const measureText = function (self, text) {
        if(self.props.canvas) {
            let ctx = self.props.canvas.getContext("2d");
            let style = JSON.parse(JSON.stringify(text.props.style));
            // the following is copied from Text.js
            ctx.font = [
                style.fontStyle, // "normal", "italic" or "oblique".
                style.fontVariant,
                style.fontWeight, // "thin", "normal", "bold". Can also be a number.
                style.fontSize + "px", // Size of the text in pixels.
                style.fontFamily // Array in the order of which font should be tried.
            ].join(" ");
            let measure = ctx.measureText(self.props.value);
            return measure;
        }
        return { width: 0 };
    };
    const ICON_MARGIN_LEFT = 2;
	var styles = {
        Normal: {
    		Monster: {
    			fontFamily: ["Stone Serif Small Caps", "Matrix Regular Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    			fontSize: 16,
    			fontWeight: 400,
    			textAlign: "left",
    			whitespace: "nowrap",

    			// left: 30,
    			left: 36,
    			top: 461,
    			width: 350,
    			height: 30
    		},
    		LargePendulumMonster: {
    			fontFamily: ["Stone Serif Small Caps", "Matrix Regular Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    			fontSize: 16,
    			fontWeight: 400,
    			textAlign: "left",
    			whitespace: "nowrap",

    			// left: 30,
    			left: 36,
    			top: 477,
    			width: 350,
    			height: 30
    		},
    		Backrow: {
    			Icon:
    			{
    				left: 421-24-50,
    				top: 77,
    				width: 24,
    				height: 24
    			},
    			Type:
    			{
    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 19.75,
    				fontWeight: 400,
    				textAlign: "right",
    				whitespace: "nowrap",

    				left: 40,
    				top: 75,
    				width: 330,
    				height: 20,
    			},
    			TypeWithIcon:
    			{
    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 19.75,
    				fontWeight: 400,
    				textAlign: "right",
    				whitespace: "nowrap",

    				left: 40,
    				top: 75,
    				width: 421 - 24/*width of icon*/ -50 /**/-40 - ICON_MARGIN_LEFT,
    				height: 20
    			},
    			TypeWithIconClosing: {

    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 24,
    				fontWeight: 400,
    				textAlign: "left",
    				whitespace: "nowrap",

    				left: 421-50,
    				top: 75,
    				width: 10,
    				height: 20
    			}
    		},
            Braces: {
                Monster: {
                    width: 5,
                    height: 15,
                    top: 465,
                },
                LargePendulumMonster: {
                    width: 5,
                    height: 15,
                    top: 465+16,
                },
                Backrow: {
                    top: 79,
                    width: 6,
                    height: 20,
                }
            }
        },
        Rush: {

    		Monster: {
    			fontFamily: ["Stone Serif Small Caps", "Matrix Regular Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    			fontSize: 16,
    			fontWeight: 400,
    			textAlign: "left",
    			whitespace: "nowrap",

    			// left: 30,
    			left: 36,
    			top: 443,
    			width: 350,
    			height: 30
    		},
    		// LargePendulumMonster: {
    		// 	fontFamily: ["Stone Serif Small Caps", "Matrix Regular Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    		// 	fontSize: 16,
    		// 	fontWeight: 400,
    		// 	textAlign: "left",
    		// 	whitespace: "nowrap",
            //
    		// 	// left: 30,
    		// 	left: 36,
    		// 	top: 477,
    		// 	width: 350,
    		// 	height: 30
    		// },
    		Backrow: {
    			Icon:
    			{
    				left: 421-24-50,
    				top: 443,
    				width: 20,
    				height: 20
    			},
    			Type:
    			{
    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 16,
    				fontWeight: 400,
    				textAlign: "left",
    				whitespace: "nowrap",

    				left: 38,
    				top: 443,
    				width: 330,
    				height: 20,
    			},
    			TypeWithIcon:
    			{
    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 16,
    				fontWeight: 400,
    				textAlign: "left",
    				whitespace: "nowrap",

    				left: 38,
    				top: 443,
    				width: 421 - 24/*width of icon*/ -50 /**/-40 - ICON_MARGIN_LEFT,
    				height: 20
    			},
    			TypeWithIconClosing: {

    				fontFamily: ["Stone Serif Small Caps", "Stone Serif Regular", "Spectral SC", "serif"],
    				fontSize: 16,
    				fontWeight: 400,
    				textAlign: "left",
    				whitespace: "nowrap",

    				left: 421-50,
    				top: 75,
    				width: 10,
    				height: 20
    			}
    		},
            Braces: {
                Monster: {
                    width: 5,
                    height: 15,
                    top: 447,
                },
                // LargePendulumMonster: {
                //     width: 5,
                //     height: 15,
                //     top: 465+16,
                // },
                Backrow: {
                    top: 447,
                    width: 5,
                    height: 15,
                }
            }
        }
	};

	var Type = ReactClass({
		render: function render() {
            let isWhite = this.props.color === "white";
            let suffix = isWhite ? "white" : "";
            let openingBrace = React.createElement(Image, {
                src: resources + "/tcg/ygo/text/leftbracket" + suffix + ".png",
                key: "openBrace",
                style: {},
            });
            let closingBrace = React.createElement(Image, {
                src: resources + "/tcg/ygo/text/rightbracket" + suffix + ".png",
                key: "closeBrace",
                style: {},
            });

            let type = this.props.type;
            type = type.replace("Vanilla", "Monster")
                       .replace("Rush", "");

            let baseStyle = styles[this.props.variant] || styles.Normal;
            let isRush = this.props.variant === "Rush";

			if(type === "Backrow") {
                let hasIcon = Icons[this.props.icon] && Icons[this.props.icon].url !== null;
				var withIcon;
                let style = Object.assign(
                    { color: this.props.color },
                    baseStyle.Backrow[hasIcon ? "TypeWithIcon" : "Type"]
                );
                let text = React.createElement(Text, {
                    text: this.props.value,
                    style: style,
                    key: "type"
                });
                let width = measureText(this, text).width;
                if(hasIcon) {
                    width += baseStyle.Backrow.Icon.width;
                }
                Object.assign(closingBrace.props.style, baseStyle.Braces.Backrow, {
                    left: isRush ? width + 18 + 24 : 421-49,
                    // left: 421-49,
                });
                Object.assign(openingBrace.props.style, baseStyle.Braces.Backrow, {
                    left: isRush ? 30 : 421 - 50 - 7 - width,
                });
                withIcon = [
                    openingBrace,
                    text,
                    closingBrace
				];
                if(hasIcon) {
                    let iconStyle = {};
                    Object.assign(iconStyle, baseStyle.Backrow.Icon);
                    if(isRush) {
                        iconStyle.left = width + 20;
                    }

                    withIcon.splice(2, 0, React.createElement(Image, {
                        src: (Icons[this.props.icon] || { url: "" }).url,
                        style: iconStyle,
                        key: "icon"
                    }));
                    if(this.props.value.length && !isRush) {
                        openingBrace.props.style.left -= ICON_MARGIN_LEFT;
                    }
                }

				return React.createElement(
					Group,
					{
						canvas: this.props.canvas,
						repaint: this.props.repaint
					},
					withIcon
				);
            }
			else if(type === "Monster" || type === "LargePendulumMonster") {
                Object.assign(openingBrace.props.style, baseStyle.Braces[type], {
                    left: 30,
                });
                let style = Object.assign(
                    { color: this.props.color },
                    baseStyle[type]
                );
                let text = React.createElement(
                    Text,
                    {
                        text: this.props.value,
                        style: style,
                    }
                );
                let width = measureText(this, text).width;
                Object.assign(closingBrace.props.style, baseStyle.Braces[type], {
        			left: Math.floor(37 + width),
                });
				return React.createElement(
					Group,
					{
						canvas: this.props.canvas,
						repaint: this.props.repaint
					},
                    openingBrace,
                    text,
                    closingBrace
				);
			}
			return null;
		}
	});
	Type.displayName = "Circulation";
	Type.defaultProps = {
		value: "",
		icon: "None",
		type: "Monster", // The other option is "Backrow".
	};
	return Type;
});
