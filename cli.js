const _ = require('lodash');
const express = require('express');

const app = express();

const getPort = require('get-port');

const libLocalIpAddressesAndHostnames = require('local-ip-addresses-and-hostnames');

const { noteDown } = require('note-down');

const { logInDetail } = require('./logging/logInDetail.js');

const logger = noteDown;
noteDown.option('showLogLine', false);

app.use((req, res, next) => { // eslint-disable-line no-unused-vars
    logInDetail(
        req,
        {
            includeCookies: true,
            includeSignedCookies: true,
            includeIps: true
        }
    );
    return res.send('Hello World!');
});

let portFromConfig = parseInt(process.env.PORT);
if (1 <= portFromConfig && portFromConfig <= 65535) {
    // do nothing
} else {
    portFromConfig = 3000;
}

(async () => {
    let portToUse;
    if (process.env.PORT_DYNAMIC === 'yes') {
        portToUse = await getPort({
            port: getPort.portNumbers(portFromConfig, 65535)
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
