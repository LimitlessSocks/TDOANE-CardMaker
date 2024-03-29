define(["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Unity(React, ReactClass, Group, Kind, C) {
	var Unity = ReactClass({
		render: function render()
		{
			return React.createElement(
				Group,
				this.props,
				React.createElement(C.Image, {
					value: this.props.image,
                    pendulum: true,
                    rarity: this.props.rarity
				}),
				React.createElement(C.Border, {
                    value: "Unity",
                    pendulum: { enabled: true }
                }),
				React.createElement(C.CardName, {
					value: this.props.name,
                    rarity: this.props.rarity
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute
				}),
				React.createElement(C.Level, {
					value: this.props.level, star: "Normal"
				}),

				React.createElement(C.Pendulum, Object.assign({}, this.props.pendulum, {
					enabled: true
				})),

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
					value: this.props.serial
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                    position: "pendulum"
				}),
				React.createElement(C.Copyright, {
					value: this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);
		}
	});
	Unity.displayName = "Unity";
    Unity.kind = Kind.Monster;
	Unity.defaultProps = {
	};
    Unity.variants = [ "Normal" ];
    Unity.hasPendulum = true;
	return Unity;
});
