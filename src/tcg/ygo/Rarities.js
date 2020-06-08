define(["./Resources"], function(resources)
{
	var path = [resources, "tcg", "ygo", "foil"].join("/");
	return {
		common:   {
            name: "Common",
            foil: undefined,
            color: undefined
        },
		rare:     {
            name: "Rare",
            foil: undefined,
            color: "silver"
        },
		ultra:    {
            name: "Ultra rare",
            foil: [ path, "Secret.png" ].join("/"),
            color: "gold"
        },
		secret:   {
            name: "Secret rare",
            foil: [ path, "Secret.png" ].join("/"),
            color: "silver"
        },
		mosaic:   {
            name: "Mosaic rare",
            // foil: [ path, "Ultimate.png" ].join("/"),
            foil: [ path, "Secret.png" ].join("/"),
            // foil: undefined,
            cardFoil: [ path, "Mosaic.png" ].join("/"),
            color: "silver",
        },
        shatter: {
            name: "Shatterfoil rare",
            foil: undefined,
            color: undefined,
            cardFoil: [ path, "Shatter.png" ].join("/"),
        },
        rainbow: {
            name: "Rainbow rare",
            foil: [ path, "Ultimate.png" ].join("/"),
            foilBlend: "normal",
            color: "white",
            cardFoil: [ path, "Rainbow.png" ].join("/"),
        },
	};
});
