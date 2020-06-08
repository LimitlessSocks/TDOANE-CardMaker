let connect = require('connect');
let serveStatic = require('serve-static');
const port = 8080;
connect().use(serveStatic(__dirname)).listen(port, function(){
    console.log(`Server running on localhost:${port}...`);
});

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question("\n------------------------------\nPress ENTER to quit\n------------------------------\n", (name) => {
    process.exit(0);
});
