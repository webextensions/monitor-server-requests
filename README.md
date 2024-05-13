# monitor-server-requests
Launch a simple HTTP server and monitor/log the requests received

## Installation
```bash
$ npm install --global monitor-server-requests
```

## Usage
```bash
$ monitor-server-requests

<OR>

$ monitor-server-requests --port <number>
For example:
    $ monitor-server-requests --port 8080

<OR>

$ monitor-server-requests --port-dynamic
```

## Help
```bash
$ monitor-server-requests --help
Usage: monitor-server-requests [options]

Launch a simple HTTP server and monitor/log the requests received

Options:
  -V, --version              output the version number
  -p, --port <number>        Port number to be used (eg: 3000, 4430, 8000, 8080 etc) ; (default: 8080)
  -d, --port-dynamic         Use dynamic port number ; (default: false)
  --disable-static           Do not serve static files ; (default: false)
  -s, --status <number>      Status code for unmatched requests (eg: 200, 404, 500 etc) ; (default: 404)
  --delay-min <number>       Minimum delay in milliseconds ; (default: 0)
  --delay-max <number>       Maximum delay in milliseconds ; (default: 0)
  --abort-randomly <number>  Abort randomly (Probability between 0 to 1) ; (default: 0)
  --optimize-for <purpose>   Optimize for (size, reading, balanced) ; (default: "balanced")
  -h, --help                 display help for command
```
