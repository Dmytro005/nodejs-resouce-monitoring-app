// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const fs = require("fs");

const config = require("./lib/config");
const handlers = require('./lib/handles');
const helpers = require('./lib/helpers');

// Instantiate http server
const httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
});

// Start the http server
httpServer.listen(config.httpPort, function() {
    console.log(
        `The server is up on port ${config.httpPort} and running in ${
            config.envName
        } mode`
    );
});

// Instantiate https server
const httpsServerOptions = {
    key: fs.readFileSync("./https/key.pem"),
    cert: fs.readFileSync("./https/cert.pem")
};
const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
    unifiedServer(req, res);
});

// Start the https server
httpsServer.listen(config.httpsPort, function() {
    console.log(
        `The server is up on port ${config.httpsPort} and running in ${
            config.envName
        } mode`
    );
});

// Unified server both for http and for https server
const unifiedServer = function(req, res) {
    // Parse the url
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, "");

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method
    const method = req.method.toLowerCase();

    //Get the headers as an object
    const headers = req.headers;

    // Get the payload,if any
    const decoder = new StringDecoder("utf-8");
    let buffer = "";
    req.on("data", function(data) {
        buffer += decoder.write(data);
    });
    req.on("end", function() {
        buffer += decoder.end();

        // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
        const chosenHandler =
            typeof router[trimmedPath] !== "undefined"
                ? router[trimmedPath]
                : handlers.notFound;

        // Construct the data object to send to the handler
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer),
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload) {
            // Use the status code returned from the handler, or set the default status code to 200
            statusCode = typeof statusCode == "number" ? statusCode : 200;

            // Use the payload returned from the handler, or set the default payload to an empty object
            payload = typeof payload == "object" ? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader("Content-Type", "application/json"); //set return data to json type
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log("Returning this response: ", statusCode, payloadString);
        });
    });
};

// Define the request router
const router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
};
