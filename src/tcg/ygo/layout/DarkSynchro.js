define(["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function DarkSynchro(React, ReactClass, Group, Kind, C) {
	var DarkSynchro = ReactClass({
		render: function render()
		{
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "DarkSynchro", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

                    React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
                    React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: -this.props.level, star: "Negative", variant: this.props.variant }),
                );
            }
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity
				}),
				React.createElement(C.Border, {
					value: "DarkSynchro", pendulum: this.props.pendulum
				}),
				React.createElement(C.CardName, {
					value: this.props.name, color: "white", rarity: this.props.rarity
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute
				}),
				React.createElement(C.Level, {
					value: -this.props.level, star: "Negative"
				}),

				React.createElement(C.Pendulum, this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type
				}),
				React.createElement(C.Effect, {
					value: this.props.effect
				}),
				React.createElement(C.Atk, {
					value: this.props.atk
				}),
				React.createElement(C.Def, {
					value: this.props.def
				}),

				React.createElement(C.Serial, {
					value: this.props.serial, color: this.props.pendulum.enabled ? undefined : "black"
				}),
				React.createElement(C.Id, {
					value: this.props.id, position: this.props.pendulum.enabled ? "pendulum" : "regular", color: this.props.pendulum.enabled ? undefined : "black"
				}),
				React.createElement(C.Copyright, {
					value: this.props.copyright, color: this.props.pendulum.enabled ? undefined : "black"
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	DarkSynchro.displayName = "DarkSynchro";
    DarkSynchro.kind = Kind.Monster;
	DarkSynchro.defaultProps = {
        boxSizeEnabled: false,
	};
    DarkSynchro.hasPendulum = false;
    DarkSynchro.variants = [ "Normal", "Anime" ];
	return DarkSynchro;
});
