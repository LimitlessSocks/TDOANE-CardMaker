define(["react", "react-class", "draw/Group", "draw/Image", "../../Resources"], function LinkMarkers(React, ReactClass, Group, Image, Resources)
{
	var positioning = {
		regular: {
			topLeft: {
				top: 95,
				left: 30,
				width: 43,
				height: 43
			},
			topCenter: {
				top: 88,
				left: (420/2) - (97/2),
				width: 97,
				height: 24
			},
			topRight: {
				top: 95,
				left: 420 - 30 - 43,
				width: 43,
				height: 43
			},
			middleLeft: {
				top: 223,
				left: 24,
				width: 24,
				height: 97
			},
			middleRight: {
				top: 223,
				left: 420 - 24 - 24,
				width: 24,
				height: 97
			},
			bottomLeft: {
				top: 407,
				left: 30,
				width: 43,
				height: 43
			},
			bottomCenter: {
				top: 433,
				left: (420/2) - (97/2),
				width: 97,
				height: 24
			},
			bottomRight: {
				top: 407,
				left: 420 - 30 - 43,
				width: 43,
				height: 43
			}
		},
		pendulum: {
			topLeft: {
				top: 95,
				left: 16,
				width: 42,
				height: 42
			},
			topCenter: {
				top: 86,
				left:(420/2) - (72/2),
				width:72,
				height: 25
			},
			topRight: {
				top: 94,
				left: 420 - 16 - 42,
				width: 42,
				height: 42
			},
			middleLeft: {
				top: 302,
				left: 6,
				width: 25,
				height: 72
			},
			middleRight: {
				top: 302,
				left: 420 - 6 -25,
				width: 25,
				height: 72
			},
			bottomLeft: {
				top: 610 - 23 - 42,
				left: 16,
				width: 42,
				height: 42
			},
			bottomCenter: {
				top: 610 - 13 - 25,
				left:(420/2) - (72/2),
				width:72,
				height: 25
			},
			bottomRight: {
				top: 610 - 23 - 42,
				left: 420 - 16 - 42,
				width: 42,
				height: 42
			}
		},
        anime: {
			topLeft: {
				top: 0,
				left: 0,
				width: 43,
				height: 43
			},
			topCenter: {
				top: 0,
				left: (420/2) - (97/2),
				width: 97,
				height: 24
			},
			topRight: {
				top: 0,
				left: 421 - 43,
				width: 43,
				height: 43
			},
			middleLeft: {
				top: 182,
				left: 0,
				width: 24,
				height: 97
			},
			middleRight: {
				top: 182,
				left: 421 - 24,
				width: 24,
				height: 97
			},
			bottomLeft: {
				top: 418,
				left: 0,
				width: 43,
				height: 43
			},
			bottomCenter: {
				top: 437,
				left: (420/2) - (97/2),
				width: 97,
				height: 24
			},
			bottomRight: {
				top: 418,
				left: 421 - 43,
				width: 43,
				height: 43
			}
        }
	};

	var path = Resources + "/tcg/ygo/marker";
	var LinkMarkers = ReactClass({
		render: function render()
		{
			var e = React.createElement;
			var children = [];

			let property;
            if(this.props.variant === "Anime") {
                property = "anime";
            }
            else if(this.props.pendulum) {
                property = "pendulum";
            }
            else {
                property = "regular";
            }
            let pos = positioning[property];
			for(var key in pos)
			{
				if (pos.hasOwnProperty(key) && this.props.hasOwnProperty(key))
				{
					if (this.props[key] === true)
					{
						children[children.length] = e(Image, { key: key, src:("" + path + "/" + key + ".png"), style: pos[key] });
					}
				}
			}

			return React.createElement(
				Group,
				{
					text: this.props.value,
					repaint: this.props.repaint,
					canvas: this.props.canvas
				},
				children
			);
		}
	});

	LinkMarkers.displayName = "LinkMarkers";
	LinkMarkers.defaultProps = {
		pendulumm: false,
		topLeft: false,
		topCenter: false,
		topRight: false,
		middleLeft: false,
		middleRight: false,
		bottomLeft: false,
		bottomCenter: false,
		bottomRight: false
	}
	return LinkMarkers;
});
