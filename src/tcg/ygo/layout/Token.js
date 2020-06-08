define(["react", "react-class", "draw/Group", "./Kind.js", "./component/All"],
function Token(React, ReactClass, Group, Kind, C) {
	var Token = ReactClass({
		render: function render()
		{
            let isLargePendulum = false;
            this.props.pendulum.boxSizeEnabled = this.props.boxSizeEnabled;
            if(this.props.pendulum.enabled && this.props.boxSizeEnabled) {
                isLargePendulum = this.props.pendulum.boxSize === "Large";
            }
            let isRush = this.props.variant === "Rush";
            let position = isRush ? "rush" : this.props.pendulum.enabled ? "pendulum" : "regular";
            let type = isRush ? "RushMonster" : isLargePendulum ? "LargePendulumMonster" : "Monster";
            if(this.props.variant === "Anime") {
                return React.createElement(
                    Group,
                    this.props,
                    React.createElement(C.Image, { value: this.props.image, pendulum: this.props.pendulum.enabled, rarity: this.props.rarity, variant: this.props.variant }),
                    React.createElement(C.Border, { value: "Token", pendulum: this.props.pendulum,  variant: this.props.variant, }),
                    React.createElement(C.Attribute, { value: this.props.attribute, variant: this.props.variant, }),
                    React.createElement(C.Pendulum, Object.assign({ variant: this.props.variant }, this.props.pendulum)),
                    React.createElement(C.CardHolo, { rarity: this.props.rarity }),

    				React.createElement(C.Atk, { value: this.props.atk, variant: this.props.variant }),
    				React.createElement(C.Def, { value: this.props.def, variant: this.props.variant }),

                    React.createElement(C.Level, { value: this.props.level, star: "Normal", variant: this.props.variant }),
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
					value: "Token",
                    pendulum: this.props.pendulum.enabled,
                    variant: this.props.variant
				}),
				React.createElement(C.CardName, {
					value: this.props.name,
                    rarity: this.props.rarity,
                    variant: this.props.variant
				}),
				React.createElement(C.Attribute, {
					value: this.props.attribute,
                    variant: this.props.variant
				}),
				React.createElement(C.Level, {
					value: this.props.level,
                    star: "Normal",
                    variant: this.props.variant
				}),

				React.createElement(C.Pendulum, isRush ? {} : this.props.pendulum),

				React.createElement(C.Type, {
					value: this.props.type,
                    variant: this.props.variant
				}),
				React.createElement(C.Effect, {
					value: this.props.effect,
                    type: type,
                    variant: this.props.variant
				}),
				React.createElement(C.Atk, {
					value: this.props.atk,
                    variant: this.props.variant
				}),
				React.createElement(C.Def, {
					value: this.props.def,
                    variant: this.props.variant
				}),

				React.createElement(C.Serial, {
					value: this.props.serial,
                    variant: this.props.variant
				}),
				React.createElement(C.Id, {
					value: this.props.id,
                    position: position
				}),
				React.createElement(C.Copyright, {
					value: isRush ? "" : this.props.copyright
				}),

                React.createElement(C.CardHolo, {
					rarity: this.props.rarity
				}),
			);

			//return React.createElement(Shared, Object.assign({}, this.props, { border: this.props.pendulum.enabled ? "res/tcg/ygo/border/Token.pendulum.png" : "res/tcg/ygo/border/Token.png"}))
		}
	});
	Token.displayName = "Token";
    Token.kind = Kind.Monster;
	Token.defaultProps = {
        boxSizeEnabled: false,
	};
    Token.hasPendulum = false;
	return Token;
});
