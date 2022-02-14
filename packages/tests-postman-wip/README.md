# Traceability Interoperability Test Suite

## Running the Test Suite

The test suite has an `npm` task definition that will remove previous test suite output and re-run the suite.

Example: run tests with default settings

```
npm run test:all
```

It is also possible to pass command-line arguments to the test suite by separating the command (`npm run test:all`) from the options (`--help`) with `--`.

Example: pass command-line options to the test runner

```
$ npm run test:all -- --help

> trace-interop-tests-wip@1.0.0 test:all
> rimraf newman; node . "--help"

Usage: npm run test:all [options]

Traceability Interoperability Test Runner

Options:
  -p, --provider <name...>  limit tests to specific providers, can be used more
                            than once (choices: "mesur.io", "Transmute",
                            "Mavennet", "Transmute DID Actor API", "all", default:
                            "all")
  -h, --help                display help for command
```

If you do not want to remove previous test runs, you can bypass the `npm` script and run the test suite via `node` directly.

_**Note**: In this scenario, it is not necessary to separate the command (`node .`) from the options (`--help`) with `--`._

Example: run test suite without removing previous output

```
$ node . --help
Usage: npm run test:all [options]

Traceability Interoperability Test Runner

Options:
  -p, --provider <name...>  limit tests to specific providers, can be used more
                            than once (choices: "mesur.io", "Transmute",
                            "Mavennet", "Transmute DID Actor API", "all", default:
                            "all")
  -h, --help                display help for command
```