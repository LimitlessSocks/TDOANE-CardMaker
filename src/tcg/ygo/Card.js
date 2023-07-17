define(["react", "react-class", "draw/Canvas", "./layout/All", "./layout/Kind.js", "./Attributes", "./Stars", "./Icons", "./Rarities"],
function App(React, ReactClass, Canvas, Layouts, Kind, Attributes, Stars, Icons, Rarities)
{
	var Card = ReactClass({
		render: function render()
		{
			return React.createElement(
				Canvas,
				{
					width: 421,
					height: 614,
					className: "ygo card",
				},
				React.createElement(
					Layouts[this.props.layout].fn,
					this.props
				)
			);
		}
	});
	Card.defaultProps = { layout: "Normal" };
	Card.displayName = "Card";
	Card.Layout = Layouts;
    Card.Kind = Kind;
	Card.Attributes = Attributes;
	Card.Stars = Stars;
	Card.Icons = Icons;
	Card.Rarities = Rarities;
    Card.BoxSizes = {
        "Small": "Small",
        "Normal": "Normal",
        "Large": "Large"
    };
    Card.StyleVariants = {
        "Normal": "Normal",
        "Anime": "Anime",
        // "Rush": "Rush",
    };
	return Card;
});
