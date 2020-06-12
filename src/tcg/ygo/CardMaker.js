define(["react", "react-class", "./Card", "webfont", "./Checkbox"], function App(React, ReactClass, Card, WebFont, Checkbox)
{
    var emptyCard = {
        version: "1.0.0",
        rarity: "Common",
        name: "",
        level: 0,
        type: "",
        effect: "",
        atk: "",
        def: "",
        serial: "0123456789",
        copyright: "© 2020 YGOPRO.ORG",
        id: "",
        attribute: "None",
        pendulum:
        {
            enabled: false,
            effect: "",
            blue: "5",
            red: "5",
            boxSize: "Normal",
            boxSizeEnabled: false,
        },
        variant: "Normal",
        link:
        {
            topLeft: false,
            topCenter: false,
            topRight: false,
            middleLeft: false,
            middleRight: false,
            bottomLeft: false,
            bottomCenter: false,
            bottomRight: false,
        },
        layout: "Normal"
    }

    const EL = (tag, data, ...children) => {
        let result = document.createElement(tag);
        if(data) {
            Object.assign(result, data);
        }
        for(let child of children.map(EL.forceElement)) {
            result.appendChild(child);
        }
        return result;
    };
    EL.text = document.createTextNode.bind(document);
    EL.forceElement = (el) =>
        typeof el === "string"
            ? EL.text(el)
            : el;
    EL.removeClasses = (el) => {
        let toRemove;
        let didRemove = false;
        while(toRemove = el.classList[0]) {
            el.classList.remove(toRemove);
            didRemove = true;
        }
        return didRemove;
    };

    const loadScript = function (url, cb) {
        let scriptElement = document.createElement("script");
        scriptElement.src = url;
        if(cb) {
            scriptElement.addEventListener("load", cb);
        }
        document.head.appendChild(scriptElement);
    };

    var CardMakerApp = ReactClass({

        getInitialState: function initialState() {
            // Initialize data.
            this.updateListeners = this.updateListeners || {};
            // Custom card maker state.
            var saveDataKey = "ccms";
            window.addEventListener("beforeunload", function(e){
                localStorage.setItem(saveDataKey, JSON.stringify(this.state));
            }.bind(this));

            var savedata = JSON.parse(localStorage.getItem(saveDataKey));
            // console.log(savedata);
            var defaultdata = {
                card:
                {
                    version: "1.0.0",
                    name: "Custom Card",
                    level: 4,
                    type: "Cyberse/Effect",
                    icon: "None",
                    effect: "A modern card designer.",
                    atk: "0",
                    def: "0",
                    serial: "0123456789",
                    copyright: "© 2020 YGOPRO.ORG",
                    attribute: "None",
                    id: "SCK-000",
                    pendulum:
                    {
                        enabled: false,
                        effect: "",
                        blue: "5",
                        red: "5",
                        boxSize: "Normal",
                        boxSizeEnabled: true,
                    },
                    variant: "Normal",
                    // anime: {
                    //     enabled: false,
                    // },
                    link:
                    {
                        topLeft: false,
                        topCenter: false,
                        topRight: false,
                        middleLeft: false,
                        middleRight: false,
                        bottomLeft: false,
                        bottomCenter: false,
                        bottomRight: false,
                    },
                    layout: "Normal"
                }
            };

            WebFont.load({
                google: {
                    families: [
                        "Buenard",
                        "Spectral SC:semi-bold,extra-bold",
                        "Spectral",
                        "Amiri:italic",
                        "Audiowide",
                        "Crimson Text:semi-bold,bold",
                        "Heebo:medium"
                    ]
                },
                fontactive: function(){this.forceUpdate();}.bind(this)
            });

            this.onFieldUpdate("card.layout", function (state, value) {
                this.updateLayoutInputs(value);
            });

            return Object.assign({}, defaultdata, savedata);
        },

        updateLayoutInputs: function updateLayoutInputs (value = null, search = document) {
            if(value === null) {
                value = this.state.card.layout;
            }
            let thisLayout = Card.Layout[value].fn;

            if(thisLayout.variants) {
                this.styleVariants = {};
                for(let key of thisLayout.variants) {
                    this.styleVariants[key] = key;
                }
            }
            else {
                this.styleVariants = this.defaultStyleVariants;
            }

            if(thisLayout.defaultProps.boxSizeEnabled) {
                this.boxSizes = null;
            }
            else {
                this.boxSizes = { "Normal": "Normal" };
            }

            let kinds = thisLayout.kind;
            if(!Array.isArray(kinds)) {
                kinds = [ kinds ];
            }
            if(this.state.card.variant === "Anime") {
                kinds.push(Card.Kind.Anime);
            }
            if(this.state.card.variant === "Rush") {
                kinds.push(Card.Kind.Rush);
            }
            // console.log(kinds);
            this.updateForKind(kinds, document);
        },

        updateForKind: function updateForKind (kinds, search = document) {
            let toFilter = search.getElementsByClassName("filter");
            let acceptClasses = kinds.map(kind => CardMakerApp.kindToClassMap[kind]);

            for(let card of toFilter) {
                let classList = card.classList;
                let classListArray = [...classList];
                let classRejects = classListArray
                    .filter(klass => klass.startsWith("not-"))
                    .map(klass => klass.replace("not-", ""));

                let accept = true;
                let hasAcceptClass = classListArray.some(klass => klass.startsWith("if-"));
                if(hasAcceptClass) {
                    accept = acceptClasses.some(acceptClass => classList.contains(acceptClass));
                }
                let passesReject = true;
                if(classRejects.length) {
                    passesReject = classRejects.every(toReject => acceptClasses.indexOf(toReject) === -1);
                }

                if(accept && passesReject) {
                    card.style.display = "";
                }
                else {
                    card.style.display = "none";
                }
            }
        },

        onFieldUpdate: function onFieldUpdate(field, fn) {
            this.updateListeners[field] = this.updateListeners[field] || [];
            this.updateListeners[field].push(fn);
        },

        render: function render() {
            function makeSelect(data)
            {
                var options = [];
                for (var key in data)
                {
                    if (data.hasOwnProperty(key))
                    {
                        element = data[key] || {};
                        options[options.length] = React.createElement(
                            "option",
                            {
                                key: key,
                                value: typeof element.value !== "undefined" ? element.value : key
                            },
                            element.name || key
                        );
                    }
                }
                return options;
            }

            var templates = makeSelect(Card.Layout);
            var attributes = makeSelect(Card.Attributes);
            var icons = makeSelect(Card.Icons);
            var rarities = makeSelect(Card.Rarities);

            // styleVariants
            this.defaultStyleVariants = this.defaultStyleVariants || makeSelect(Card.StyleVariants);
            this.styleVariants = this.styleVariants || this.defaultStyleVariants;
            if(!Array.isArray(this.styleVariants)) {
                this.styleVariants = makeSelect(this.styleVariants);
            }

            if(!this.styleVariants.some(({ key }) => key === this.state.card.variant)) {
                this.state.card.variant = this.styleVariants[0].key;
            }

            // boxSizes
            this.defaultBoxSizes = this.defaultBoxSizes || makeSelect(Card.BoxSizes);
            this.boxSizes = this.boxSizes || this.defaultBoxSizes;
            if(!Array.isArray(this.boxSizes)) {
                this.boxSizes = makeSelect(this.boxSizes);
            }

            if(!this.boxSizes.some(({ key }) => key === this.state.card.boxSize)) {
                this.state.card.boxSize = this.boxSizes[0].key;
            }

            let thisLayout = Card.Layout[this.state.card.layout].fn;
            let levelName = thisLayout.levelName || "Level";
            let hasPendulum = thisLayout.hasPendulum;

            if(this.state.card.variant === "Anime") {
                hasPendulum = true;
            }

            if(!hasPendulum) {
                this.state.card.pendulum.enabled = false;
            }

            let e = React.createElement;
            let labelText = (text) => e("span", { className: "label-text" }, text);

            // let reactCard = e(Card, this.state.card);
            // console.log(reactCard);
            let result = e(
                "div",
                {
                    className: "cardmaker ygo"
                },
                e(
                    "div",
                    { className: "live-preview" },
                    // reactCard,
                    e(Card, this.state.card),

                    e("table", { className: "options" },
                        e("tr", null,
                            e("td", null, e("button", { onClick: this.create, className: "ipsButton ipsButton_primary"}, "New Card")),
                            e("td", null, e("button", { onClick: this.save, className: "ipsButton ipsButton_primary" }, "Save Card")),
                        ),
                        e("tr", null,
                            e("td", null, e("button", { onClick: this.exportAsPrompt, className: "ipsButton ipsButton_primary" }, "Export As")),
                            e("td", null, e("button", { onClick: this.open, className: "ipsButton ipsButton_primary" }, "Load Card")),
                        )
                    )
                ),
                e(
                    "div",
                    { className: "editor" },

                    e("table", null, e("tbody", null,
                        e("tr", null,
                            e("td", null, e("label", null, labelText("Name"),  e("input", { onChange: this.updateField("card.name"), type: "text", value: this.state.card.name }))),
                            e("td", null, e("label", null, labelText("Template"), e("select",  { onChange: this.updateField("card.layout"), value: this.state.card.layout }, templates))),
                            e("td", null, e("label", null, labelText("Rarity"), e("select", { onChange: this.updateField("card.rarity"), value: this.state.card.rarity }, rarities)))
                        ),
                        e("tr", null,
                            e("td", null, e("label", null, labelText("Symbol"), e("select", { onChange: this.updateField("card.attribute"), value: this.state.card.attribute }, attributes))),
                            e("td", { class: "filter not-if-anime" }, e("label", null, labelText("Type"),  e("input", { onChange: this.updateField("card.type"), type: "text", value: this.state.card.type }))),
                            e("td", { class: "filter if-monster not-if-link" }, e("label", null, labelText(levelName), e("input", { onChange: this.updateField("card.level"), type: "number", value: this.state.card.level }))),
                            e("td", { class: "filter if-backrow" }, e("label", null, labelText("Icon"), e("select", { onChange: this.updateField("card.icon"), value: this.state.card.icon }, icons)))
                        ),
                        e("tr", null,
                            e("td", null, e("label", null, labelText("Style Variant"), e("select", { disabled: this.styleVariants.length <= 1, onChange: this.updateField("card.variant"), value: this.state.card.variant }, this.styleVariants))),
                            e("td", { class: "filter if-monster" }, e("label", null, labelText("Attack"), e("input", { onChange: this.updateField("card.atk"), type: "text", value: this.state.card.atk }))),
                            e("td", { class: "filter if-monster" }, e("div", null,
                                e("label", { class: "filter not-if-link" }, labelText("Defense"), e("input", { onChange: this.updateField("card.def"), type: "text", value: this.state.card.def })),
                                e("label", { class: "filter if-link" }, labelText("Link Rating"), e("input", { onChange: this.updateField("card.def"), type: "text", value: this.state.card.def }))
                            ))
                        ),
                        e("tr", { class: "filter not-if-anime" },
                            e("td", null, e("label", null, labelText("Set id"), e("input", { onChange: this.updateField("card.id"), type: "text", value: this.state.card.id }))),
                            e("td", null, e("div", { id: "serial-container" },
                                e("label", { id: "serial-number" }, labelText("Serial number"), e("input", { onChange: this.updateField("card.serial"), type: "text", value: this.state.card.serial })),
                                e("button", { id: "serial-randomize", onClick: this.randomizeSerialNumber, className: "ipsButton ipsButton_primary" }, "Randomize"),
                            )),
                            e("td", { class: "filter not-if-rush" }, e("label", null, labelText("Copyright"), e("input", { onChange: this.updateField("card.copyright"), type: "text", value: this.state.card.copyright }))),
                        )
                    )),

                    e("table", null, e("tbody", null,
                        e("tr", null,
                            e("td", { colSpan: 2 }, e("label", null, labelText("Image"), e("input", { onChange: this.updateField("card.image"), type: "text" }), e("input", { onChange: this.updateCardImage("image"), type: "file" })))
                        ),
                        e("tr", null,
                            e("td", null, e("label", null, labelText("Effect"), e("textarea", { id: "effect-input", onChange: this.updateField("card.effect"), value: this.state.card.effect }))),
                        ),
                    )),

                    // link
                    e(
                        "fieldset",
                        { class: "filter if-link", id: "link-container" },
                        e("legend", null, e("label", {}, "Link")),
                        e("table", null, e("tbody",null,
                            e("tr", null,
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.topLeft", onChange: function(e){this.updateField("card.link.topLeft")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.topLeft }),
                                    e("label", { htmlFor: "ccm_ygo:link.topLeft"}, "")
                                ),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.topCenter", onChange: function(e){this.updateField("card.link.topCenter")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.topCenter }),
                                    e("label", { htmlFor: "ccm_ygo:link.topCenter"}, "" )
                                ),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.topRight", onChange: function(e){this.updateField("card.link.topRight")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.topRight }),
                                    e("label", { htmlFor: "ccm_ygo:link.topRight"}, "" )
                                )
                            ),
                            e("tr", null,
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.middleLeft", onChange: function(e){this.updateField("card.link.middleLeft")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.middleLeft }),
                                    e("label", { htmlFor: "ccm_ygo:link.middleLeft"}, "")
                                ),
                                e("td"),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.middleRight", onChange: function(e){this.updateField("card.link.middleRight")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.middleRight }),
                                    e("label", { htmlFor: "ccm_ygo:link.middleRight"}, "" )
                                )
                            ),
                            e("tr", null,
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.bottomLeft", onChange: function(e){this.updateField("card.link.bottomLeft")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.bottomLeft }),
                                    e("label", { htmlFor: "ccm_ygo:link.bottomLeft"}, "")
                                ),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.bottomCenter", onChange: function(e){this.updateField("card.link.bottomCenter")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.bottomCenter }),
                                    e("label", { htmlFor: "ccm_ygo:link.bottomCenter"}, "" )
                                ),
                                e("td", null,
                                    e(Checkbox, { id: "ccm_ygo:link.bottomRight", onChange: function(e){this.updateField("card.link.bottomRight")({target: {value: e.target.checked}});}.bind(this), checked: this.state.card.link.bottomRight }),
                                    e("label", { htmlFor: "ccm_ygo:link.bottomRight"}, "" )
                                )
                            )
                        ))
                    ),

                    // pendulum
                    e(
                        "fieldset",
                        { class: "filter not-if-rush" + (hasPendulum ? "" : " hidden") },
                        e(
                            "legend",
                            null,
                            e(Checkbox, { id: "ccm_ygo:pendulum.enabled", onChange: function(e){this.updateField("card.pendulum.enabled")({target: {value: e.target.checked}});}.bind(this), type: "checkbox", checked: this.state.card.pendulum.enabled }),
                            e("label", { htmlFor: "ccm_ygo:pendulum.enabled"}, labelText("Pendulum") )
                        ),

                        e("table", { class: "mintable" },
                            e("tr", null,
                                e("td", { class: "pendulum-scale-holder" }, e("label", { class: "blue-scale" }, labelText("Blue scale"), e("input", { onChange: this.updateField("card.pendulum.blue"), type: "text", value: this.state.card.pendulum.blue }))),
                                e("td", { class: "pendulum-scale-holder" }, e("label", { class: "red-scale" }, labelText("Red scale"), e("input", { onChange: this.updateField("card.pendulum.red"), type: "text", value: this.state.card.pendulum.red }))),
                                e("td", null, e("label", { class: "filter not-if-anime" }, labelText("Pendulum box size"), e("select",  { disabled: this.boxSizes.length <= 1, onChange: this.updateField("card.pendulum.boxSize"), value: this.state.card.pendulum.boxSize }, this.boxSizes)))
                            )
                        ),
                        e("label", { class: "filter not-if-anime" }, labelText("Effect"), e("textarea", { onChange: this.updateField("card.pendulum.effect"), type: "text", value: this.state.card.pendulum.effect })),
                    ),

                    e("pre", { "className": "special" }, "∞ ☆ ● © ™"),

                    e("button", { onClick: this.credits }, "Credits"),

                    e("button", { onClick: this.developer }, "Developer Features"),
                ),
                // popup
                e("div", { id: "popup-area", class: "hidden", onClick: (e) => e.target === e.currentTarget && this.closePopup() },
                    e("div", { id: "popup-content" },
                        e("button", { id: "popup-close", onClick: (e) => this.closePopup() }, "X"),
                        e("h2", { id: "popup-header" }, "Test Message"),
                        e("p", { id: "popup-text" }, "This is a test"),
                    )
                )
            );

            this.updateLayoutInputs(null, result);

            return result;
        },
        developer: function developer() {
            let options = [
                ["Process image database", "processDatabaseCreate"],
                ["Log image data", "logImageData"]
            ];
            let body = EL("div");
            for(let [tag, operation] of options) {
                let button = EL("button");
                button.appendChild(EL.text(tag));
                button.addEventListener("click", () => {
                    this[operation]();
                });
                body.appendChild(button);
            }
            this.popup("Developer Features", body);
        },
        logImageData: function logImageData() {
            console.log(this.state.card);
        },
        processDatabaseCreate: function processDatabaseCreate(loaded = false) {
            if(!loaded) {
                return loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.2/jszip.min.js",
                    () => this.processDatabaseCreate(true)
                );
            }
            let imageInput = EL("input", { type: "file", accept: ".zip" });
            let cardDatabaseInput = EL("input", { type: "file", accept: ".json" });
            let submit = EL("button", null, "Submit");
            let body = EL("div", null,
                "Image Repository (.zip):",
                imageInput,
                "Card Database (.json, Dueling Nexus format):",
                cardDatabaseInput,
                submit,
            );
            submit.addEventListener("click", () => {
                JSZip.loadAsync(imageInput.files[0])
                .then((zipFile) => {
                    let reader = new FileReader();
                    reader.readAsText(cardDatabaseInput.files[0], "UTF-8");
                    reader.onload = (evt) => {
                        let json = JSON.parse(evt.target.result);
                        this.processDatabase(json, zipFile);
                    };
                });
            });
            this.popup("Process Database", body, "wide");
        },
        convertEntry: function (entry) {
            // TODO: pendulums
            let getStat = (stat) =>
                stat === -2
                    ? "?"
                    : stat.toString();
            let CardBorders = {
                2: "Spell",
                4: "Trap",
                128: "Ritual",
                64: "Fusion",
                8192: "Synchro",
                16384: "Token",
                8388608: "Xyz",
                67108864: "Link",
                16: "Normal",
                32: "Effect",
            };
            let MonsterTypes = {
                1: "Warrior",
                2: "Spellcaster",
                4: "Fairy",
                8: "Fiend",
                16: "Zombie",
                32: "Machine",
                64: "Aqua",
                128: "Pyro",
                256: "Rock",
                512: "Winged Beast",
                1024: "Plant",
                2048: "Insect",
                4096: "Thunder",
                8192: "Dragon",
                16384: "Beast",
                32768: "Beast-Warrior",
                65536: "Dinosaur",
                131072: "Fish",
                262144: "Sea Serpent",
                524288: "Reptile",
                1048576: "Psychic",
                2097152: "Divine-Beast",
                4194304: "Creator God",
                8388608: "Wyrm",
                16777216: "Cyberse",
            };
            let MonsterAttributes = {
                1: "Earth",
                2: "Water",
                4: "Fire",
                8: "Wind",
                16: "Light",
                32: "Dark",
                64: "Divine",
            };
            let SpellTrapIcons = {
                128: "Ritual",
                65536: "Quick-play",
                131072: "Continuous",
                262144: "Equip",
                524288: "Field",
                1048576: "Counter",
            };
            const LinkArrowMeanings = {
                [0b000000001]: "bottomLeft",
                [0b000000010]: "bottomCenter",
                [0b000000100]: "bottomRight",
                [0b000001000]: "middleLeft",
                [0b000100000]: "middleRight",
                [0b001000000]: "topLeft",
                [0b010000000]: "topCenter",
                [0b100000000]: "topRight",
            };
            const blankPendulum = {
                enabled: false,
                blue: "5",
                red: "5",
                effect: "",
                boxSize: "Normal",
            };

            let result = {};

            result.pendulum = blankPendulum;

            result.name = entry.name;
            result.effect = entry.description;
            result.atk = getStat(entry.attack);
            result.def = getStat(entry.defence);
            result.level = entry.level.toString();
            let border;
            for(let [mask, resBorder] of Object.entries(CardBorders)) {
                if(entry.type & mask) {
                    border = resBorder;
                    if(mask <= 4) {
                        break;
                    }
                }
            }
            result.layout = border || result.layout;
            result.serial = entry.id.toString();
            if(entry.type & 1) {
                // if it is a monster
                let typeNames = [];
                let monsterType = MonsterTypes[entry.race];
                typeNames.push(monsterType);
                if(entry.type & 2097152) {
                    typeNames.push("Flip");
                }
                typeNames.push(result.layout);

                if(entry.type & 16777216) {
                    let [ pend, regular ] = result.effect
                        .replace(/\[ \w+ Effect \]/g, "")
                        .split(/-{4,}/)
                        .map(e => e.trim());

                    // console.log(regular, pend, result.effect);

                    result.effect = regular;
                    result.pendulum = {
                        enabled: true,
                        blue: entry.lscale.toString(),
                        red: entry.rscale.toString(),
                        effect: pend,
                        boxSize: "Normal",
                    };
                    if(pend.length <= 150) {
                        result.pendulum.boxSize = "Small";
                    }
                    typeNames.push("Pendulum");
                }

                if(result.layout !== "Effect" && result.layout !== "Normal") {
                    typeNames.push("Effect");
                }
                result.type = typeNames.join("/");
                result.attribute = MonsterAttributes[entry.attribute] || "None";

                if(result.layout === "Link") {
                    result.def = result.level;
                    result.link = {};
                    for(let i = 256; i >= 1; i >>= 1) {
                        result.link[LinkArrowMeanings[i]] = !!(entry.defence & i);
                    }
                }
            }
            else {
                result.attribute = result.layout;
                result.type = result.layout + " Card";
                result.icon = "None";
                for(let [mask, resIcon] of Object.entries(SpellTrapIcons)) {
                    if(entry.type & mask) {
                        result.icon = resIcon;
                        break;
                    }
                }
            }
            return result;
        },
        processDatabase: async function processDatabase(json, zipFile) {
            let outZip = new JSZip();
            let imageFiles = zipFile.file(/.*/);
            let count = 0;
            let total = imageFiles.length;
            for(let image of imageFiles) {
                let newState = {};
                // overhead parsing
                let base = image.name.split(/[\/\\]/).pop().split(".");
                let ext = base.pop();
                base = base.join(".");
                // get URL
                let arr = await image.async("base64");
                let type = "image/" + ext;
                let url = "data:" + type + ";base64," + arr;
                newState.image = url;
                // get data
                let entry = json[base];

                Object.assign(newState, this.convertEntry(entry));
                // update state
                this.setState({ card: Object.assign({}, this.state.card, newState)});
                let status = await new Promise((resolve, reject) => {
                    count++;
                    let next = EL("button", null, "Next");
                    let pause = EL("button", null, "Pause");
                    let finish = EL("button", null, "Finish Now");
                    let body = EL("div", null, next, pause, finish, EL("div", null, count + "/" + total));

                    let popupBody = () => this.popup("Ready?", body);

                    next.addEventListener("click", function () {
                        resolve(true);
                    });
                    finish.addEventListener("click", function () {
                        resolve(false);
                    });
                    pause.addEventListener("click", function () {
                        let resume = EL("button", null, "Resume Processing");
                        let parent = document.getElementsByClassName("editor")[0];
                        parent.appendChild(resume);
                        this.closePopup();
                        resume.addEventListener("click", function () {
                            parent.removeChild(resume);
                            popupBody();
                        });
                    });
                    popupBody();
                });
                let toExport = this.getDataURL("JPG");
                toExport = toExport.replace(/data:.*?;base64,/, "");

                outZip.file(base + ".jpg", toExport, { base64: true });
                this.closePopup();
                if(!status) {
                    break;
                }
            }
            this.popup("Zip File Generating", "Please wait, zip generating.");
            outZip.generateAsync({ type: "blob" }).then(blob => {
                let filename = "cardImages.zip";
                if (window.navigator.msSaveOrOpenBlob) // IE10+
                    window.navigator.msSaveOrOpenBlob(blob, filename);
                else { // Others
                    var a = document.createElement("a"),
                            url = URL.createObjectURL(blob);
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        this.popup("Zip File Generated", "Please accept the file download");
                    }, 0);
                }
            });

        },
        credits: function credits() {
            let body = document.createElement("div");
            let toParse = [
                ["Commissioned by:", "Seto Kaiba", "https://github.com/realSetoKaiba"],
                ["Programmed by:", "Sock#3222", "https://github.com/LimitlessSocks"],
                ["Management lead:", "Soaring__Sky#3222", "https://github.com/SoaringSky"],
                ["Rush Duel Templates by:", "alixsep", "https://www.deviantart.com/alixsep"],
                ["Derived from:", "Yemachu Cardmaker", "https://github.com/Yemachu/cardmaker"],
            ];
            for(let [intro, name, href] of toParse) {
                let linkBody = EL("p", null,
                    intro,
                    " ",
                    EL("a", { href: href, target: "_blank" }, name)
                );
                body.appendChild(linkBody);
            }
            this.popup("Credits", body);
        },
        create: function create()
        {
            this.setState({ card: emptyCard });
        },

        save: function save()
        {
            var link = document.createElement("a");
            link.setAttribute("href", "data:/text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.card)));
            link.setAttribute("download", (this.state.card.name || "Card") + ".json");
            if (document.createEvent)
            {
                var evt = document.createEvent("MouseEvent");
                evt.initEvent("click", true, true);
                link.dispatchEvent(evt);
            }
            else
            {
                link.click();
            }
        },

        // available styles: "default", "wide"
        popup: function (title, body, style="default") {
            body = EL.forceElement(body);
            let clearChildren = function (...nodes) {
                for(let node of nodes) {
                    while(node.firstChild) {
                        node.removeChild(node.firstChild);
                    }
                }
            };
            let popup = document.getElementById("popup-content");
            EL.removeClasses(popup);
            popup.classList.add(style);

            let popupArea = document.getElementById("popup-area");
            let header = document.getElementById("popup-header");
            let text = document.getElementById("popup-text");
            clearChildren(header, text);
            header.appendChild(document.createTextNode(title));
            text.appendChild(body);
            popupArea.classList.remove("hidden");
        },

        closePopup: function () {
            let popupArea = document.getElementById("popup-area");
            popupArea.classList.add("hidden");
        },

        getDataURL: function getDataURL(ext = "PNG") {
            let canvas = document.getElementsByTagName("canvas")[0];
            let dataURL;
            switch(ext) {
                case "PNG":
                    dataURL = canvas.toDataURL();
                    break;
                case "JPGHIGH":
                    dataURL = canvas.toDataURL("image/jpeg", 1.0);
                    break;
                case "JPG":
                    dataURL = canvas.toDataURL("image/jpeg");
                    break;
                case "JPGLOW":
                    dataURL = canvas.toDataURL("image/jpeg", 0.5);
                    break;
            }
            return dataURL;
        },

        exportAs: function (ext) {
            return (ev) => {
                let dataURL = this.getDataURL(ext);
                if(!dataURL) {
                    return;
                }
                let img = document.createElement("img");
                img.className = "img-result";
                img.src = dataURL;
                img.width = "250";
                img.addEventListener("click", function () {
                    window.open(dataURL, "_blank");
                });
                let divHolder = document.createElement("div");
                divHolder.appendChild(img);
                let message2 = document.createElement("div");
                message2.appendChild(
                    document.createTextNode("Click or tap the picture to download!")
                );
                divHolder.appendChild(message2);
                this.popup("Result", divHolder);
            };
        },

        exportAsPrompt: function () {
            let body = document.createElement("div");
            let options = {
                "PNG": "PNG",
                "JPGHIGH": "JPG (Best Quality)",
                "JPG": "JPG (High Quality)",
                "JPGLOW": "JPG (Low Quality)",
            };
            for(let [option, desc] of Object.entries(options)) {
                let button = document.createElement("button");
                button.addEventListener("click", this.exportAs(option));
                button.appendChild(document.createTextNode(desc));
                body.appendChild(button);
            }
            this.popup("Export Options", body);
        },

        open: function()
        {
            var file = document.createElement("input");
            file.setAttribute("type", "file");
            file.setAttribute("accept", ".json");
            file.addEventListener("change", function(evt)
            {
                var files = evt.target.files;
                if (FileReader && files.length)
                {
                    var fr = new FileReader();
                    fr.onload = function()
                    {
                        try
                        {
                            var card = JSON.parse(fr.result);
                            this.setState({ card: card });
                        }
                        catch(e)
                        {
                            console.error(e);
                        }
                    }.bind(this);
                    fr.readAsText(files[0]);
                }
            }.bind(this));
            if (document.createEvent)
            {
                var evt = document.createEvent("MouseEvent");
                evt.initEvent("click", true, true);
                file.dispatchEvent(evt);
            }
            else
            {
                link.click();
            }
        },

        updateField: function updateField(fieldName)
        {
            var nesting = fieldName.split(".");
            return function(event)
            {
                var path = [];
                var current = this.state;
                for (var i=0; i<nesting.length; ++i)
                {
                    path[path.length] = { node: current, name: nesting[i] };
                    current = current[nesting[i]];
                }
                path.reverse();
                // console.log("UPDATE PATH:", path);
                var newState = path.reduce(function(accumulator, current)
                {
                    var nested = {};
                    nested[current.name] = accumulator;
                    return Object.assign({}, current.node, nested)
                }, event.target.value);
                this.setState(newState);

                if(this.updateListeners[fieldName]) {
                    for(let fn of this.updateListeners[fieldName]) {
                        fn.bind(this)(this.state, event.target.value);
                    }
                }
            }.bind(this);
        },

        updateTemplate: function(event)
        {
            this.setState({ card: Object.assign({}, this.state.card, { layout: Card.Layout[event.target.value]})});
        },

        updateCardImage: function(fieldName)
        {
            return function(event)
            {

                var files = event.target.files;
                if (FileReader && files && files.length)
                {
                    var fr = new FileReader();
                    fr.onload = function()
                    {
                        var newState = {};
                        newState[fieldName] = fr.result;
                        this.setState({ card: Object.assign({}, this.state.card, newState)});
                    }.bind(this);
                    fr.readAsDataURL(files[0]);
                }
            }.bind(this);
        },

        randomizeSerialNumber: function()
        {
            var value = "0000000000" + (Math.random() * 10000000000).toFixed(0);
            // console.log(typeof value);

            this.updateField("card.serial")({target:{value: value.substring(value.length-10)}});
        }
    });

    CardMakerApp.kindToClassMap = {
        [Card.Kind.Monster]: "if-monster",
        [Card.Kind.Link]:    "if-link",
        [Card.Kind.Backrow]: "if-backrow",
        [Card.Kind.Skill]:   "if-skill",
        [Card.Kind.Anime]:   "if-anime",
        [Card.Kind.Rush]:    "if-rush",
    }
    return CardMakerApp;
});
