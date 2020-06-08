define(["react", "react-class", "draw/Image", "../../Rarities"], function Image(React, ReactClass, Img, Rarities)
{
	var styles = {
        Normal: {
    		Normal: {
    			left: 47,
                top: 109,
    			width: 326,
    			height: 326,
    		},
    		Pendulum: {
    			left: 25,
    			top: 107,
    			width: 371,
    			height: 371,
    		},
        },
        Anime: {
    		Normal: {
    			left: 12,
                top: 12,
    			width: 397,
    			height: 437,
    		},
    		Pendulum: {
    			left: 12,
                top: 12,
    			width: 397,
    			height: 437,
    		},
        },
        Rush: {
    		Normal: {
    			left: 22,
                top: 61,
    			width: 376, // min width: 376
    			height: 380,
    		},
        }
	}

	var Image = ReactClass({
		render: function render()
		{
            // let base = this.props.anime ? styles.Anime : styles.Normal;
            let base = styles[this.props.variant] || styles.Normal;
			let style = this.props.pendulum ? base.Pendulum : base.Normal;
            style = style || base.Normal;
			let foil = React.createElement("span");
            let rarityInfo = Rarities[this.props.rarity] || {};
			return React.createElement(
				React.Fragment,
				null,
				React.createElement(
					Img,
					{
						src: this.props.value,
						style: style,
						repaint: this.props.repaint,
						canvas: this.props.canvas
					}
				),
                // picture foil
				React.createElement(
					Img,
					{
						src: rarityInfo.foil,
						style: Object.assign({}, style, { mixBlendMode: rarityInfo.foilBlend || "color-dodge"}),
						repaint: this.props.repaint,
						canvas: this.props.canvas

					}
				)
			);
		}
	});
	Image.displayName = "Image";
	Image.defaultProps = {
		rarity: "common"
	};
	return Image;
});
