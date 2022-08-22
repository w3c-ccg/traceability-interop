# Test Result Reporting

## Environment Setup

To build and run the test reporting, first install and run either [miniconda](https://docs.conda.io/en/latest/miniconda.html) or full [conda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html)


Once that is installed, you can create the reporting environment with the following command:

```bash
$ conda env create -f environment.yml python=3.9
```


And then activate it:

```bash
$ conda activate reporting
```

## Run reporting

The reporter can be run from your local machine with one of the following command:

```bash
$ ./reporter.py --conformance
$ ./reporter.py --interoperability
```

It will automatically fetch the latest test results, process them, and launch a server hosting the dashboard at [http://localhost:8050/](http://localhost:8050/)

Test results are sourced from the JSON test results published in github pages in one of the following locations based on the provided command-line options (either `--conformance` or `--interoperability`)

- [Interoperability test results](https://w3c-ccg.github.io/traceability-interop/reports/interoperability/index.json)
- [Conformance test results](https://w3c-ccg.github.io/traceability-interop/reports/conformance/index.json)

The reporter can also be run in CI mode, which will find test output in the `docs/reports` folder on the test runner instead of downloading published report output. If you want to test this mode locally, i.e., during development, you will need to run the postman test suite and post-process the results into the `docs/reports` folder yourself before running `reporter.py`.

```bash
$ ./reporter.py --mode ci --conformance
$ ./reporter.py --mode ci --interoperability
```

To get a full list of reporter options, you can execute the reporter with the help parameter:
```bash
$ ./reporter.py -h
usage: reporter.py [-h] [--mode [{all,data,html,dashboard,ci}]] (-c | -i)

Interop test results reporting utility

optional arguments:
  -h, --help            show this help message and exit
  --mode [{all,data,html,dashboard,ci}]
                        mode to run the reporter in

Report Type:
  One of the following options MUST be specified.

  -c, --conformance     generate a report based on the most recently published conformance testing output.
  -i, --interop         generate a report based on the most recently publised interoperability testing output.
```

## Module Description

There are three main modules:

- `./postman_reporter/report_data.py` — go get the data, link it up, create appropriate data frames, and store them as CSV for easy use
- `./postman_reporter/report_static.py` — generate a static HTML report for use with gh-pages
- `./postman_reporter/report_dashboard.py` — the latter half of this app that spins up a dash app on flask for actually working with the test results
- `reporter.py` — the main binary that runs one or more modules as listed above, based on command line arguments

## Output

After running the reporter you will see a dashboard in your browser
![image](https://user-images.githubusercontent.com/3495140/174913518-0612f10a-fe81-442c-816e-ab69fac285fa.png)

In addition to the summary stats multiple drill through visualizations that cross compare results and identify problems in red are available
![image](https://user-images.githubusercontent.com/3495140/174913726-f94a8aff-7163-4b82-aaec-6aa0f6b3cc93.png)
![image](https://user-images.githubusercontent.com/3495140/174913749-0fa20211-c37e-4895-ad2d-7772dcaeb70a.png)

There is also a searchable and filterable table of all unit test results
![image](https://user-images.githubusercontent.com/3495140/174913783-b5fd187d-908c-4c69-a67d-ad0f3dd94100.png)