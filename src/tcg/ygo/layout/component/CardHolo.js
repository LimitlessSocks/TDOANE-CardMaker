define(["react", "react-class", "draw/Image", "../../Resources", "../../Rarities"],
function CardHolo(React, ReactClass, Image, resources, Rarities) {
    let CardHolo = ReactClass({
        render: function render() {
            let holo = (Rarities[this.props.rarity] || {}).cardFoil;
            return React.createElement(Image, {
                src: holo,
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
    CardHolo.displayName = "CardHolo";
    CardHolo.defaultProps = {

    };
    return CardHolo;
});
