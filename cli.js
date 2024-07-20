#!/usr/bin/env node

const readline = require('node:readline');

const { program } = require('commander');

const _ = require('lodash');
const express = require('express');
const serveIndex = require('serve-index');
const cookieParser = require('cookie-parser');

const tcpPortUsed = require('tcp-port-used');

const networkDelay = require('express-network-delay');

const app = express();

const libLocalIpAddressesAndHostnames = require('local-ip-addresses-and-hostnames');

const { noteDown } = require('note-down');

const { expressLogInDetail } = require('./logging/logInDetail.js');

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
    .option('-p, --port <number>',       'Port number to be used (eg: 3000, 4430, 8000, 8080, etc) ;',      DEFAULT_PORT)
    .option('-d, --port-dynamic',        'Use dynamic port number ;',                                       false)
    .option('--disable-static',          'Do not serve static files ;',                                     false)
    .option('-s, --status <number>',     'Status code for unmatched requests (eg: 200, 404, 500, etc) ;',   404)
    .option('-r, --response <content>',  'Response for unmatched requests (eg: "ok", "{\\"a\\":1}" etc) ;', null)
    .option('--delay-min <number>',      'Minimum delay in milliseconds ;',                                 0)
    .option('--delay-max <number>',      'Maximum delay in milliseconds ;',                                 0)
    .option('--abort-randomly <number>', 'Abort randomly (Probability between 0 to 1) ;',                   0)
    .option('--optimize-for <purpose>',  'Optimize for (size, reading, balanced) ;',                        'balanced');

program.parse();

const options = program.opts();

const logger = noteDown;
noteDown.option('showLogLine', false);

const chalk = noteDown.chalk;

app.use(cookieParser());

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(expressLogInDetail({
    includeCookies: true,
    includeSignedCookies: true,
    includeIps: true,
    optimizeFor: options.optimizeFor
}));

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

    logger.info('Serving files from: ' + chalk.reset(chalk.bold(cwd)));
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

    const responseFromConfig = options.response;
    let content = responseFromConfig;
    if (!content) {
        content = JSON.stringify({ status: statusCode }, null, 4) + '\n';
    }

    app.all('*', (req, res, next) => { // eslint-disable-line no-unused-vars
        return (
            res
                .setHeader('Content-Type', 'application/json')
                .status(statusCode)
                .send(content)
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
        const {
            default: getPort,
            portNumbers
        } = await import('get-port');
        portToUse = await getPort({
            port: portNumbers(portFromConfig, 65535)
        });
    } else {
        portToUse = portFromConfig;
    }

    const isPortInUse = await tcpPortUsed.check(portToUse);
    if (isPortInUse) {
        logger.error(`Port ${portToUse} is already in use.`);
        logger.verbose(`In such cases, we recommend launching ${packageName} with ${chalk.bold('--port-dynamic')} parameter.`);
        logger.verbose(`Exiting...`);
        process.exit(1);
    } else {
        logger.info('Starting server on port ' + portToUse);
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
                logger.info('This server can be accessed from the following path:');
            } else {
                logger.info('This server can be accessed from any of the following paths:');
            }

            localhostPaths.forEach(function (localhostPath) {
                logger.verbose('\t' + 'http://' + localhostPath + ':' + portToUse + '/');
            });
        }

        logger.info('Press Ctrl+C to stop the server');
        logger.info('Type `cls` or `clear` and press enter to clear the terminal screen');
    });
})();

const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

readlineInterface.on('line', (input) => {
    switch (input.trim()) {
        case 'clear':
        case 'cls':
            // Note: There is a `console.clear()` method as well, but, it doesn't seem to follow a predictable behavior
            // in some cases when tested in terminal. Haven't tested the behavior in debug mode and probably
            // `console.clear()` might work better inside Node.js/Chrome DevTools and we may want to use both the
            // approaches together.
            process.stdout.write('\u001Bc'); // Clear the terminal screen
            break;
    }
});

readlineInterface.on('SIGINT', () => {
    logger.error(`${packageName} stopped ... Exiting`);
    process.exit(0);
});
