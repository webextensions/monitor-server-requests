const { noteDown } = require('note-down');

const logger = noteDown;
noteDown.option('showLogLine', false);

const getFullUrl = function (req) {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    return fullUrl;
};

const getRequestDetails  = function (
    req,
    {
        includeCookies = false,
        includeSignedCookies = false,
        includeIps = false
    } = {}
) {
    const requestDetails = {};

    const localTime = (new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60 * 1000))).toISOString().substr(11, 12);
    requestDetails['localTime'] = localTime;

    const utcTimestamp = (new Date().toISOString()).replace('T', ' ').replace('Z', '');
    requestDetails['utcTimestamp'] = utcTimestamp;

    const method = req.method;
    requestDetails['method'] = method;

    const fullUrl = getFullUrl(req);
    requestDetails['fullUrl'] = fullUrl;

    const ip = req.ip;
    requestDetails['ip'] = ip;

    if (includeIps) {
        const ips = req.ips;
        requestDetails['ips'] = ips;
    }

    const query = JSON.stringify(req.query);
    requestDetails['query'] = query;

    const headersAsString = JSON.stringify(req.headers);
    requestDetails['headers'] = headersAsString;

    if (includeCookies) {
        let cookiesAsString;
        try {
            cookiesAsString = JSON.stringify(req.cookies);
        } catch (err) {
            cookiesAsString = String(req.cookies);
        }
        requestDetails['cookies'] = cookiesAsString;
    }
    if (includeSignedCookies) {
        let signedCookiesAsString;
        try {
            signedCookiesAsString = JSON.stringify(req.signedCookies);
        } catch (err) {
            signedCookiesAsString = String(req.signedCookies);
        }
        requestDetails['signedCookies'] = signedCookiesAsString;
    }

    let bodyAsString;
    try {
        bodyAsString = JSON.stringify(req.body);
    } catch (err) {
        bodyAsString = String(req.body);
    }
    requestDetails['body'] = bodyAsString;

    return requestDetails;
};

const logInDetail = function (
    req,
    {
        includeCookies = false,
        includeSignedCookies = false,
        includeIps = false
    } = {}
) {
    const requestDetails = getRequestDetails(
        req,
        {
            includeCookies,
            includeSignedCookies,
            includeIps
        }
    );

    logger.verbose('');
    logger.verbose('>>>>');
    logger.verbose('    => Time              - ' + requestDetails['localTime'] + ' (UTC: ' + requestDetails['utcTimestamp'] + ')');
    logger.info('    => Request URL       - ' + requestDetails['fullUrl']);
    logger.verbose('    => req.method        - ' + requestDetails['method']);
    logger.verbose('    => req.ip            - ' + requestDetails['ip']);

    if (includeIps) {
        logger.verbose('    => req.ips           - ' + requestDetails['ips']);
    }

    logger.verbose('    => req.query         - ' + requestDetails['query']);
    logger.verbose('    => req.headers       - ' + requestDetails['headers']);

    if (includeCookies) {
        logger.verbose('    => req.cookies       - ' + requestDetails['cookies']);
    }

    if (includeSignedCookies) {
        logger.verbose('    => req.signedCookies - ' + requestDetails['signedCookies']);
    }

    logger.verbose('    => req.body          - ' + requestDetails['body']);
    logger.verbose('<<<<');

    return requestDetails;
};

module.exports = { logInDetail };
