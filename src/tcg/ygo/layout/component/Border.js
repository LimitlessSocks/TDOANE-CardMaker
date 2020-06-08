define(["react", "react-class", "draw/Image", "../../Resources"],
function Border(React, ReactClass, Image, resources) {
	var Border = ReactClass({
		render: function render()
		{
			let border = resources + "/tcg/ygo/border/" + this.props.value + ".png";
            let isAnime = this.props.variant === "Anime";
            let isRush = this.props.variant === "Rush";
			if (this.props.pendulum && this.props.pendulum.enabled && !isRush)
			{
                let suffix = "pendulum";
                if(this.props.pendulum.boxSize !== "Normal"
                && this.props.pendulum.boxSizeEnabled
                && !isAnime)
                {
                    suffix += "." + this.props.pendulum.boxSize.toLowerCase();
                }
                suffix = "." + suffix + ".png";
				border = border.replace(".png", suffix);
			}
            if(isAnime) {
                border = border.replace(".png", ".anime.png");
            }
            else if(isRush) {
                border = border.replace(".png", ".rush.png");
            }
			return React.createElement(Image, {
				src: border,
				style: {
					left: 0,
					top: 0,
					width: 421,
					height: 614
				},
				canvas: this.props.canvas,
				repaint: this.props.repaint
			});
		}
	});
	Border.displayName = "Border";
	Border.defaultProps = {
		value: "Normal"
	};
	return Border;
});
