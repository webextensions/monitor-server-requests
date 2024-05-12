#!/usr/bin/env node

const _ = require('lodash');
const express = require('express');
const serveIndex = require('serve-index');

const app = express();

const getPort = require('get-port');

const libLocalIpAddressesAndHostnames = require('local-ip-addresses-and-hostnames');

const { noteDown } = require('note-down');

const { logInDetail } = require('./logging/logInDetail.js');

const logger = noteDown;
noteDown.option('showLogLine', false);

app.use((req, res, next) => {
    logInDetail(
        req,
        {
            includeCookies: true,
            includeSignedCookies: true,
            includeIps: true
        }
    );
    return next();
});

const cwd = process.cwd();

logger.verbose('Serving files from: ' + cwd);
app.use(express.static(cwd));
app.use(serveIndex(cwd, { icons: true }));

app.use((req, res, next) => { // eslint-disable-line no-unused-vars
    return res.status(404).send('404: Page not found');
});

let portFromConfig = parseInt(process.env.PORT);
if (1 <= portFromConfig && portFromConfig <= 65535) {
    // do nothing
} else {
    portFromConfig = 8080;
}

(async () => {
    let portToUse;
    if (process.env.PORT_DYNAMIC === 'yes') {
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
