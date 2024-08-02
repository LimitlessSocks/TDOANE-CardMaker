# API

This is the structure of the API used by the card maker.

## POST `/api/custom-card/submit.php`

Represents submission of a card. This API call expects and accepts a JSON `body`, and returns a JSON `response`.

Parameters for `body`:

```js
{
    "id": null or string, // null if action is to upload a new card
    "card": {
        // card info:
        "layout": string, // one of "Normal", "Effect", "Ritual", "Fusion", "Synchro", "Xyz", "Link", "Token", "Spell", "Trap", or "Skill",
        "name": string, // name of the card
        "effect": string, // body of the card
        "type": string, // the type line (for Monsters and Skills) or the byline (for Spells/Traps)
        "cardArt": base64string, // the picture used for the card's art; starting with data:image/png;base64,
        "cardImage": base64string, // the picture used to represent the entire card; starting with data:image/jpeg;base64
        "setId": string, // cosmetic set ID; top right relative to textbox
        "serial": string, // cosmetic serial number; bottom left relative to textbox
        "copyright": string, // cosmetic copyright string; bottom right relative to textbox
        "rarity": string, // visual rarity affecting card rendering; one of "common", "rare", "ultra", "secret", "mosaic", "shatter", "rainbow"
        "variant": string, // the layout actually used by the card; one of "Normal" or "Anime"
        "attribute": string, // the Attribute of the card; one of "None", "Dark", "Divine", "Earth", "Fire", "Light", "Water", "Wind", "Spell", or "Trap"
        "pendulum": {
            "enabled": boolean,
            // the following parameters are only present if pendulum.enabled == true:
            "effect": string, // the effect in the pendulum box
            "blue": string, // the value corresponding to the blue (left) scale
            "red": string, // the value corresponding to the red (right) scale
            "boxSize": string, // the height of the pendulum box; one of "Small", "Normal", or "Large"
        },
        // monster specific parameters (only present if .layout is one of "Normal", "Effect", "Ritual", "Fusion", "Synchro", "Xyz", "Link", or "Token"):
            "atk": string, // the ATK of the card
            "def": string, // the DEF of the card
            "level": string, // the Level/Rank/Link Rating of the card
            "link": null or { // null if the card is not a link
                // each of these corresponds to whether the arrow in the corresponding location is enabled (true) or not (false)
                "bottomCenter": boolean,
                "bottomLeft": boolean,
                "bottomRight": boolean,
                "middleLeft": boolean,
                "middleRight": boolean,
                "topCenter": boolean,
                "topLeft": boolean,
                "topRight": boolean,
            },
        // spell/trap specific parameters (only present if .layout is one of "Spell" or "Trap"):
            "icon": string, // the icon in the bytline; one of "None", "Continuous", "Counter", "Equip", "Field", "Quick-Play", "Ritual", "Splice"
    }
}
```

Parameters for `response`:

```js
{
    "success": boolean, // returns true if the card was successfully added, false otherwise
    "id": integer, // the internal ID associated with the card that was stored
    "action": string, // the action the server took; one of "insert", "update", or "delete"
    // controls for the message displayed to the user
    // note: "delete" action not (currently) handled by frontend
    "error": string, // provided iff .success == false, a string describing what went wrong
}
```
