define(["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Link(React, ReactClass, Group, Kind, C) {
	var Link = ReactClass({
		render: function render()
		{
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Link", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

                    React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
                    React.createElement(C.Def, { value: "L-" + this.props.def, variant: this.props.variant }),

                    // React.createElement(C.Link, { value: this.props.def }),
    				React.createElement(C.LinkMarkers, Object.assign({pendulum: this.props.pendulum.enabled, variant: this.props.variant }, this.props.link) ),
                );
            }
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: this.props.pendulum.enabled,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Border, {
					value: "Link",
                    pendulum: this.props.pendulum,
                    variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                    color: "white",
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),

				React.createElement(C.LinkMarkers, Object.assign(
                    {
                        pendulum: this.props.pendulum.enabled,
                        variant: this.props.variant
                    },
                    this.props.link
                )),
				React.createElement(C.Pendulum, this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				// Recycle the DEF value as it shouldn't appear at the same time.
				React.createElement(C.Link, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
                    value: this.props.id,
                    position: this.props.pendulum.enabled ? "pendulum" : "link"
                }),
				React.createElement(C.Copyright, {
					value: this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);

			//return React.createElement(Shared, Object.assign({}, this.props, { border: this.props.pendulum.enabled ? "res/tcg/ygo/border/Link.pendulum.png" : "res/tcg/ygo/border/Link.png"}))
		}
	});
    //
	Link.displayName = "Link";
    Link.kind = [ Kind.Monster, Kind.Link ];
	Link.defaultProps = {
	};
    Link.variants = [ "Normal", "Anime" ];
    Link.hasPendulum = false;
	return Link;
});
