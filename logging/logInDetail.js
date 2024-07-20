const { noteDown } = require('note-down');

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

    const query = req.query;
    requestDetails['query'] = query;
    const queryAsString = JSON.stringify(query);
    requestDetails['queryAsString'] = queryAsString;

    const headers = req.headers;
    requestDetails['headers'] = headers;
    const headersAsString = JSON.stringify(headers);
    requestDetails['headersAsString'] = headersAsString;

    if (includeCookies) {
        const cookies = req.cookies;
        requestDetails['cookies'] = cookies;
        const cookiesAsString = JSON.stringify(cookies);
        requestDetails['cookiesAsString'] = cookiesAsString;
    }
    if (includeSignedCookies) {
        const signedCookies = req.signedCookies;
        requestDetails['signedCookies'] = signedCookies;
        const signedCookiesAsString = JSON.stringify(signedCookies);
        requestDetails['signedCookiesAsString'] = signedCookiesAsString;
    }

    const body = req.body;
    requestDetails['body'] = body;
    const bodyAsString = JSON.stringify(body);
    requestDetails['bodyAsString'] = bodyAsString;

    return requestDetails;
};

const logInDetail = function (
    req,
    {
        logger = noteDown,
        includeCookies = false,
        includeSignedCookies = false,
        includeIps = false,
        optimizeFor = 'balanced'
    } = {}
) {
    const loggerVerbose = logger.verbose?.bind(logger) || logger.trace?.bind(logger) || logger.log?.bind(logger) || logger.info?.bind(logger);
    const loggerInfo = logger.info?.bind(logger) || logger.log?.bind(logger);

    const requestDetails = getRequestDetails(
        req,
        {
            includeCookies,
            includeSignedCookies,
            includeIps
        }
    );

    const jsonStringifyAndAlign = function (json) {
        try {
            return JSON.stringify(json, null, 4).replace(/\n/g, '\n       ');
        } catch (err) {
            return String(json);
        }
    };

    loggerVerbose('');
    loggerVerbose('<<<<');

    loggerVerbose(        '    => Time              - ' + requestDetails['localTime'] + ' (UTC: ' + requestDetails['utcTimestamp'] + ')');
    loggerInfo(           '    => Request URL       - ' + requestDetails['fullUrl']);
    loggerVerbose(        '    => req.method        - ' + requestDetails['method']);
    loggerVerbose(        '    => req.ip            - ' + requestDetails['ip']);

    if (includeIps) {
        loggerVerbose(    '    => req.ips           - ' + requestDetails['ips']);
    }

    if (optimizeFor === 'reading') {
        loggerVerbose(    '    => req.query         - ' + jsonStringifyAndAlign(requestDetails['query']));
    } else {
        loggerVerbose(    '    => req.query         - ' + requestDetails['queryAsString']);
    }

    if (optimizeFor === 'reading') {
        loggerVerbose(    '    => req.headers       - ' + jsonStringifyAndAlign(requestDetails['headers']));
    } else {
        loggerVerbose(    '    => req.headers       - ' + requestDetails['headersAsString']);
    }

    if (includeCookies) {
        if (optimizeFor === 'reading') {
            loggerVerbose('    => req.cookies       - ' + jsonStringifyAndAlign(requestDetails['cookies']));
        } else {
            loggerVerbose('    => req.cookies       - ' + requestDetails['cookiesAsString']);
        }
    }

    if (includeSignedCookies) {
        if (optimizeFor === 'reading') {
            loggerVerbose('    => req.signedCookies - ' + jsonStringifyAndAlign(requestDetails['signedCookies']));
        } else {
            loggerVerbose('    => req.signedCookies - ' + requestDetails['signedCookiesAsString']);
        }
    }

    if (optimizeFor === 'reading' || optimizeFor === 'balanced') {
        loggerVerbose(    '    => req.body          - ' + jsonStringifyAndAlign(requestDetails['body']));
    } else {
        loggerVerbose(    '    => req.body          - ' + requestDetails['bodyAsString']);
    }

    loggerVerbose('>>>>');

    return requestDetails;
};

const expressLogInDetail = function (
    {
        logger = noteDown,
        includeCookies = false,
        includeSignedCookies = false,
        includeIps = false,
        optimizeFor = 'balanced'
    } = {}
) {
    return function (req, res, next) {
        logInDetail(
            req,
            {
                logger,
                includeCookies,
                includeSignedCookies,
                includeIps,
                optimizeFor
            }
        );
        return next();
    };
};

module.exports = {
    logInDetail,
    expressLogInDetail
};
