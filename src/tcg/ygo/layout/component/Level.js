define(["react", "react-class", "../../Stars", "draw/Group", "draw/Image", "draw/Text"],
function Level(React, ReactClass, Stars, Group, Image, Text)
{
	// Maximum number of stars to draw at a time. Should not be 0.
	var MAX_LEVEL = 12;

    let strategies = {
        Normal: [
	       // styleForLevel_1_through_11
           {
        		float: "right",

        		// Positioning based on 420 × 610.
                // TODO: update for 421 x 614
        		left: 43, // (420 - width) / 2
        		top: 73, // Measured from the image.

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 334, // Max width of the total number of stars.

                // range of levels it applies to
                range: [1, 11]
            },
        	// styleForLevel_12
            {
        		float: "right",

        		// Positioning based on 420 × 610.
        		left: 35, // (420 - width) / 2
        		top: 73, // Measured from the image.

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 350, // Max width of the total number of stars.
                range: [12]
        	}
    	],
        Anime: [
           {
        		float: "right",

        		left: 36,
        		top: 483,

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 284, // Max width of the total number of stars.

                // range of levels it applies to
                range: [1, 10]
            },
            {
        		float: "right",

        		left: 21,
        		top: 483,

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 312, // Max width of the total number of stars.
                range: [11]
        	},
            {
        		float: "right",

        		// Positioning based on 420 × 610.
        		left: 14, // (420 - width) / 2
        		top: 483, // Measured from the image.

        		width: 28, // Width of a star.
        		height: 28, // Height of a star.
        		maxWidth: 320, // Max width of the total number of stars.
                range: [12]
        	}
    	],
    };

    let LevelStrategy = {
        Normal: null,
        Anime: null,
    };
    for(let key of Object.keys(LevelStrategy)) {
        let strategy = [ null ];
        for(let segment of strategies[key]) {
            let [ start, end ] = segment.range;
            end = typeof end === "undefined" ? start : end;
            delete segment.range;
            for(let i = start; i <= end; i++) {
                strategy[i] = segment;
            }
        }
        LevelStrategy[key] = strategy;
    }
    let StarStrokeColors = {
        "Normal": "#dc3523",
        "Xyz": "#000000",
        "Rainbow": "#555500",
        // "Rainbow": gradient,
    };

	var Level = ReactClass({
        renderStrategy: function renderStrategy()
        {
            this.props.variant = this.props.variant || "Normal";
            let strategy = LevelStrategy[this.props.variant];
            // console.log("Strategy:", strategy, this.props);
            // Calculate the spacing between each star.
            let styleForLevel_12 = strategy[12];

            var spacing = ((styleForLevel_12.maxWidth - (MAX_LEVEL * styleForLevel_12.width)) / MAX_LEVEL);
			// Contains the images which will eventually be drawn.
			var levels = [];
			var level = Math.min(Math.abs(this.props.value), MAX_LEVEL);

			var style = strategy[level] || {};

			var rtl = this.props.value > 0;

			var width = rtl ? (style.maxWidth - (style.width + spacing)) : 0;
			var direction = rtl ? -1 : 1;

			// Generate the images which will be drawn, but no more than allowed.
			for (var i=0; i<level; ++i)
			{
				levels[levels.length] = React.createElement(
					Image,
					{
						// Get the url of the star to draw on the image.
						src: Stars[this.props.star].url,
						// React requires identifiers when assigning children by an array.
						key: "star:" + i,
						style: {
							// Position the star based on its number.
							left: style.left + width + (direction * (i * (style.width +spacing))),
							top: style.top,
							// The images used for the stars are square.
							width: style.width,
							height: style.height,
						}
					});

			}
			return React.createElement(
				Group,
				this.props,
				levels
			);
        },
        renderRush: function renderRush() {
            let url = Stars[this.props.star].url;
            url = url.replace(".png", ".rush.png");
            let img = React.createElement(
                Image,
                {
                    // Get the url of the star to draw on the image.
                    src: url,
                    // React requires identifiers when assigning children by an array.
                    // key: "star",
                    style: {
                        left: 24,
                        top: 370,
                        width: 63,
                        height: 68,
                    }
                }
            );
            let strokeColor = StarStrokeColors[this.props.star] || StarStrokeColors.Normal;

            let text = React.createElement(Text, {
                text: Math.abs(this.props.value).toString(),
                style: {
            		fontFamily: ["Eurostile Candy W01", "Palatino Linotype", "Crimson Text", "serif"],
            		fontSize: 28,
            		textAlign: "center",
            		whitespace: "nowrap",
                    color: "white",
            		fontWeight: 600,

                    strokeColor: strokeColor,
                    strokeWidth: 3,

                    left: 32,
                    top: 392,
                    width: 45,
                    height: undefined
                },
                key: "leveltext"
            });
            return React.createElement(
                Group,
                this.props,
                [ img, text ]
            );
        },
		render: function render()
		{
            if(this.props.variant === "Rush") {
                return this.renderRush();
            }
            else {
                return this.renderStrategy();
            }
		}
	});
	// Make the name slightly more descriptive when debugging.
	Level.displayName = "Level";
	Level.defaultProps = {

	};
	return Level;
});
