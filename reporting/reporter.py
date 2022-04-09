#!/usr/bin/env python
import argparse
from postman_reporter import report_data
# from postman_reporter import report_static
from postman_reporter import report_dashboard

def runData():
    report_data.getData()
    return 0

def runDash():
    app = report_dashboard.getApp()
    print(app)
    app.run_server()
    return 0

def runHtml():
    print('Static HTML not yet implemented!')
    return 0

def main(args):
    if args.mode == "all" or args.mode == "data":
        runData()

    if args.mode == "all" or args.mode == "html":
        runHtml()

    if args.mode == "all" or args.mode == "dashboard":
        runDash()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Interop test results reporting utility')
    parser.add_argument(
        '--mode', type=str, 
        default="all",
        const='all', 
        nargs='?',
        choices=['all', 'data', 'html', 'dashboard'],
        help='mode to run the reporter in'
    )

    args = parser.parse_args()
    main(args)