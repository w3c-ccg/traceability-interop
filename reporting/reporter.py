#!/usr/bin/env python
import argparse
import glob
import json
import os

import requests
from jinja2 import Environment, FileSystemLoader
from postman_reporter import (report_config, report_dashboard, report_data,
                              report_static)


def runData(args):
    def _json_from_url(url):
        return json.loads(requests.get(url).text)

    def _reports_from_url(url):
        def func():
            data = json.loads(requests.get(url).text)
            items = data["items"]
            report_sources = []
            for item in items:
                if ".json" in item:
                    report_sources.append(item)
            return report_sources

        return func

    url = os.path.join(report_config.REPORTS_BASE_URL, args.type, "index.json")

    report_data.getData(
        get_reports=_reports_from_url(url),
        get_json=_json_from_url,
    )

    return 0


def runDash():
    app = report_dashboard.getApp()
    print(app)
    app.run_server()
    return 0


def runHtml(args):
    # Create the jinja2 environment.
    current_directory = os.path.dirname(os.path.abspath(__file__))
    env = Environment(loader=FileSystemLoader(current_directory))
    path = os.path.join("assets", f"{args.type}.j2")
    template = env.get_template(path)
    report_static.generate_html(template)
    return 0


def runCi():
    """
    runCi prepares report data from local docs/reports folder and uses that
    data to generate a static interactive HTML report.
    """

    def _reports_from_file(path):
        def func():
            files = glob.glob(f"{path}/*.json")
            return [i for i in files if not i.endswith("index.json")]

        return func

    def _json_from_file(path):
        with open(path, "r") as fh:
            return json.load(fh)

    report_data.getData(
        get_reports=_reports_from_file(report_config.CI_DIR),
        get_json=_json_from_file,
    )

    runHtml()


def main(args):
    # first check for data dir
    if not os.path.exists("./data"):
        os.mkdir(
            "./data"
        )  # explicitly let it throw an exception if permissions are not there

    # then for html
    if not os.path.exists("./html"):
        os.mkdir(
            "./html"
        )  # explicitly let it throw an exception if permissions are not there

    # now check args
    if args.mode == "all" or args.mode == "data":
        runData(args)

    if args.mode == "all" or args.mode == "html":
        runHtml(args)

    if args.mode == "all" or args.mode == "dashboard":
        runDash()

    if args.mode == "ci":
        runCi()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Interop test results reporting utility"
    )
    parser.add_argument(
        "--mode",
        type=str,
        default="all",
        const="all",
        nargs="?",
        choices=["all", "data", "html", "dashboard", "ci"],
        help="mode to run the reporter in",
    )

    # Mutually-exclusive group must be nested in an argument group in order to
    # support providing a title and description in help output.
    group = parser.add_argument_group(
        "Report Type",
        "One of the following options MUST be specified.",
    )
    group = group.add_mutually_exclusive_group(required=True)

    group.add_argument(
        "-c",
        "--conformance",
        dest="type",
        action="store_const",
        const="conformance",
        help="generate a report based on the most recently published conformance testing output",
    )

    group.add_argument(
        "-i",
        "--interoperability",
        dest="type",
        action="store_const",
        const="interoperability",
        help="generate a report based on the most recently published interoperability testing output",
    )

    args = parser.parse_args()
    main(args)
