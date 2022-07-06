#!/usr/bin/env python
import argparse
import glob
import json
import os

from jinja2 import Environment, FileSystemLoader
from postman_reporter import report_config, report_dashboard, report_data, report_static


def runData():
    report_data.getData()
    return 0


def runDash():
    app = report_dashboard.getApp()
    print(app)
    app.run_server()
    return 0


def runHtml():
    # Create the jinja2 environment.
    current_directory = os.path.dirname(os.path.abspath(__file__))
    env = Environment(loader=FileSystemLoader(current_directory))
    template = env.get_template(report_config.TEMPLATE_FILE)
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
        runData()

    if args.mode == "all" or args.mode == "html":
        runHtml()

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

    args = parser.parse_args()
    main(args)
