#!/usr/bin/env node

const { program } = require('commander');

const _ = require('lodash');
const express = require('express');
const serveIndex = require('serve-index');
const cookieParser = require('cookie-parser');

const networkDelay = require('express-network-delay');

const app = express();

const getPort = require('get-port');

const libLocalIpAddressesAndHostnames = require('local-ip-addresses-and-hostnames');

const { noteDown } = require('note-down');

const { logInDetail } = require('./logging/logInDetail.js');

const
    packageJson = require('./package.json'),
    packageName = packageJson.name,
    packageDescription = packageJson.description,
    packageVersion = packageJson.version;

program
    .name(packageName)
    .description(packageDescription)
    .version(packageVersion);

const DEFAULT_PORT = 8080;

program
    .option('-p, --port <number>',       'Port number to be used (eg: 3000, 4430, 8000, 8080 etc) ;',    DEFAULT_PORT)
    .option('-d, --port-dynamic',        'Use dynamic port number ;',                                    false)
    .option('--disable-static',          'Do not serve static files ;',                                  false)
    .option('-s, --status <number>',     'Status code for unmatched requests (eg: 200, 404, 500 etc) ;', 404)
    .option('--delay-min <number>',      'Minimum delay in milliseconds ;',                              0)
    .option('--delay-max <number>',      'Maximum delay in milliseconds ;',                              0)
    .option('--abort-randomly <number>', 'Abort randomly (Probability between 0 to 1) ;',                0)
    .option('--optimize-for <purpose>',  'Optimize for (size, reading, balanced) ;',                     'balanced');

program.parse();

const options = program.opts();

const logger = noteDown;
noteDown.option('showLogLine', false);

app.use(cookieParser());

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use((req, res, next) => {
    logInDetail(
        req,
        {
            includeCookies: true,
            includeSignedCookies: true,
            includeIps: true,
            optimizeFor: options.optimizeFor
        }
    );
    return next();
});

let delayMinFromConfig = parseInt(options.delayMin);
if (0 <= delayMinFromConfig && delayMinFromConfig <= Number.MAX_SAFE_INTEGER) {
    // do nothing
} else {
    delayMinFromConfig = DEFAULT_PORT;
}

let delayMaxFromConfig = parseInt(options.delayMax);
if (0 <= delayMaxFromConfig && delayMaxFromConfig <= Number.MAX_SAFE_INTEGER) {
    // do nothing
} else {
    delayMaxFromConfig = DEFAULT_PORT;
}

app.use(networkDelay(delayMinFromConfig, delayMaxFromConfig));

let abortRandomlyFromConfig = parseFloat(options.abortRandomly);
if (0 <= abortRandomlyFromConfig && abortRandomlyFromConfig <= 1) {
    // do nothing
} else {
    abortRandomlyFromConfig = 0;
}
app.use((req, res, next) => {
    if (Math.random() < abortRandomlyFromConfig) {
        logger.verbose('Warning: Aborting randomly');
        return req.socket.end();
    }
    return next();
});

if (options.disableStatic) {
    // do nothing
} else {
    const cwd = process.cwd();

    logger.verbose('Serving files from: ' + cwd);
    app.use(express.static(cwd));

    // https://github.com/expressjs/serve-index/issues/70
    // https://stackoverflow.com/questions/34494634/http-post-express-server-returns-405-error-if-it-enables-serve-index/64137350#64137350
    // Problematic code (eg: for POST requests):
    //     app.use(serveIndex(cwd, { icons: true }));
    // Working code:
    app.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }

        return serveIndex(cwd, { icons: true })(req, res, next);
    });
}

// Just a code block
{
    const statusCodeFromConfig = parseInt(options.status);

    let statusCode;
    if (100 <= statusCodeFromConfig && statusCodeFromConfig <= 999) {
        statusCode = statusCodeFromConfig;
    } else {
        statusCode = 404;
    }

    app.all('*', (req, res, next) => { // eslint-disable-line no-unused-vars
        return (
            res
                .setHeader('Content-Type', 'application/json')
                .status(statusCode)
                .send(
                    JSON.stringify({ status: statusCode }, null, 4) + '\n'
                )
        );
    });
}

let portFromConfig = parseInt(options.port);
if (1 <= portFromConfig && portFromConfig <= 65535) {
    // do nothing
} else {
    portFromConfig = DEFAULT_PORT;
}

(async () => {
    let portToUse;
    if (options.portDynamic) {
        portToUse = await getPort({
            port: getPort.makeRange(portFromConfig, 65535)
        });
    } else {
        portToUse = portFromConfig;
    }

    app.listen(portToUse, () => {
        let localIpAddressesAndHostnames;
        try {
            localIpAddressesAndHostnames = libLocalIpAddressesAndHostnames.getLocalIpAddressesAndHostnames();
        } catch (e) {
            localIpAddressesAndHostnames = [];
        }

        const localhostPaths = _.uniq(localIpAddressesAndHostnames);

        if (localhostPaths.length) {
            if (localhostPaths.length === 1) {
                logger.verbose('This server can be accessed from the following path:');
            } else {
                logger.verbose('This server can be accessed from any of the following paths:');
            }

            localhostPaths.forEach(function (localhostPath) {
                logger.verbose('\t' + 'http://' + localhostPath + ':' + portToUse + '/');
            });
        }
    });
})();
