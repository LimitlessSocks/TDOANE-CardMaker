const express = require("express");
const serveStatic = require("serve-static");
const fs = require("fs");
const { deserialize } = require("v8");

// this doesn't include any author checks
const exampleDatabase = {
    data: {},
    uuid: 10000,
    serialize() {
        return JSON.stringify({ data: this.data, uuid: this.uuid });
    },
    deserialize(jsonBody) {
        const { data, uuid } = JSON.parse(jsonBody);
        this.data = data;
        this.uuid = uuid;
    },
    DB_PATH: "testdb.json",
    load() {
        if(fs.existsSync(this.DB_PATH)) {
            this.deserialize(fs.readFileSync(this.DB_PATH));
        }
        else {
            this.deserialize('{ "data": {}, "uuid": 10000 }');
            this.save();
        }
    },
    save() {
        fs.writeFileSync(this.DB_PATH, this.serialize());
    },
    getNewUUID() {
        return this.uuid++;
    },
    update(id, card) {
        this.data[id] = card;
        this.save();
        return {
            success: true,
            id: id,
            action: "update",
        };
    },
    insert(card) {
        let id = this.getNewUUID();
        this.data[id] = card;
        this.save();
        return {
            success: true,
            id: id,
            action: "insert",
        };
    },
    retrieve(id) {
        // TODO: error handling
        return this.data[id];
    },
};
// TODO: allow editing of cards
exampleDatabase.load();

const app = express();

app.use(express.static(__dirname, {
    index: false,
    extensions: ["html"],
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.post("/api/custom-card/submit.php", (req, res) => {
    let cardData = req.body.card;
    let id = req.body.id;
    if(id) {
        let response = exampleDatabase.update(id, cardData);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(response));
    }
    else {
        let response = exampleDatabase.insert(cardData);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(response));
    }
});
app.get("/api/custom-card/get-all.php", (req, res) => {
    res.end(JSON.stringify(exampleDatabase.data));
});
app.get("/api/custom-card/get-single.php", (req, res) => {
    res.end(JSON.stringify(exampleDatabase.retrieve(req.query.id)));
});

const port = process.env.PORT || 8080; // You can use environment variables for port configuration
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
});
readline.question("\n------------------------------\nPress ENTER to quit\n------------------------------\n", (name) => {
    process.exit(0);
});
