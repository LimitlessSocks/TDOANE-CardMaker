define(["react", "react-class"], function Kind(React, ReactClass) {
    return {
        Anime:      Symbol("Kind.Anime"),
        Rush:       Symbol("Kind.Rush"),
        Monster:    Symbol("Kind.Monster"),
        Link:       Symbol("Kind.Link"),
        Backrow:    Symbol("Kind.Backrow"),
        Skill:      Symbol("Kind.Skill"),
    };
});
