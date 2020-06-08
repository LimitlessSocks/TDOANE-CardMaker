define(["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Trap(React, ReactClass, Group, Kind, C) {
	var Trap = ReactClass({
		render: function render()
		{
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Trap", pendulum: this.props.pendulum, variant: this.props.variant }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant, backrow: true,  }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),
                );
            }
            let isRush = this.props.variant === "Rush";
            let color = isRush ? "black" : "white";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
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
                    value: "Trap",
                    pendulum: this.props.pendulum.enabled,
                    variant: this.props.variant
                }),
				React.createElement(C.CardName, {
                    value: this.props.name,
                    color: color,
                    rarity: this.props.rarity,
                    variant: this.props.variant
                }),
				React.createElement(C.Attribute, {
                    value: this.props.attribute,
                    variant: this.props.variant
                }),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
                    value: this.props.type,
                    type: "Backrow",
                    icon: this.props.icon,
                    variant: this.props.variant
                }),
				React.createElement(C.Effect, {
                    value: this.props.effect,
                    type: isRush ? "RushBackrow" : "Backrow"
                }),

				React.createElement(C.Serial, {
                    value: this.props.serial,
                    variant: this.props.variant
                }),
				React.createElement(C.Id, { value: this.props.id, position: position }),
				React.createElement(C.Copyright, { value: isRush ? "" : this.props.copyright }),

                React.createElement(C.CardHolo, { rarity: this.props.rarity }),
			);
		}
	});
	Trap.displayName = "Trap";
    Trap.kind = Kind.Backrow;
	Trap.defaultProps = {
        boxSizeEnabled: false,
	};
    Trap.hasPendulum = false;
	return Trap;
});
