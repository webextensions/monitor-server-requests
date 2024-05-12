#!/usr/bin/env node

/* eslint-disable filenames/no-index */

const { logInDetail } = require('./logging/logInDetail.js');

module.exports = {
    logInDetail,
    monitorServerRequests: logInDetail
};
