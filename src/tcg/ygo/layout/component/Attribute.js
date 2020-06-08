define(["react", "react-class", "../../Attributes", "draw/Image"],
function Attribute(React, ReactClass, Attributes, Image)
{
    let styles = {
        Normal: {
            // Positioning based on 420 × 610.
            // TODO: update for 421 x 614
            left:  356,
            top:    27,
            width:  40,
            height: 40,
        },
        Anime: {
            left:  344,
            top:   477,
            width:  40,
            height: 40,
        },
        AnimeBackrow: {
            left:  190,
            top:   517,
            width:  40,
            height: 40,
        },
        Rush: {
            left:  345,
            top:    22,
            width:  54,
            height: 54
        }
    }
	var Attribute = ReactClass({
		render: function render()
		{
            // let style = this.props.anime ? styles.Anime : styles.Normal;
            let style;
            let url = Attributes[this.props.value].url
            if(this.props.variant === "Anime") {
                style = this.props.backrow ? styles.AnimeBackrow : styles.Anime;
            }
            else if(this.props.variant === "Rush") {
                style = styles.Rush;
                if(!url) {
                    url = Attributes["Void"].url;
                }
                url = url.replace(".png", ".rush.png");
            }
            else {
                style = styles.Normal;
            }
			var props = Object.assign({}, this.props, {
				// Maps the attribute to a path name
				src: url,
				style: style,
			});
			return React.createElement(Image, props);
		}
	});
	Attribute.displayName = "Attribute";
	Attribute.defaultProps = {
		value: "None",
	};

	return Attribute;
});
