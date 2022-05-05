#!/usr/bin/env python
import argparse
import os

from postman_reporter import report_dashboard
from postman_reporter import report_data
from postman_reporter import report_static


def runData():
    report_data.getData()
    return 0


def runDash():
    app = report_dashboard.getApp()
    print(app)
    app.run_server()
    return 0


def runHtml():
    report_static.generate_html()
    return 0


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
        choices=["all", "data", "html", "dashboard"],
        help="mode to run the reporter in",
    )

    args = parser.parse_args()
    main(args)
