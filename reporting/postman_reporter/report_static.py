#!/usr/bin/env python
from datetime import datetime

import postman_reporter.report_charts as report_charts
import postman_reporter.reporter_util as reporter_util


def generate_html():
    df = reporter_util.get_dataframes()
    now = str(datetime.now())

    summaryText = report_charts.getSummaryText(df["df_summary_provider"], now)
    summaryProvider, summaryProviderMulti = report_charts.getCards(
        df["df_summary_provider"]
    )
    facet_tests = report_charts.getFacet(df["df_inter"])
    results_chart = report_charts.getSunburst(df["df_details"])
    results_tree = report_charts.getTree(
        df["df_details"], path=["Provider", "Test Type", "Test Step"]
    )
    # result_details = report_charts.getTable(df["df_main"], "results-table", filter=True)

    facet_tests.write_html("html/facet_tests.html")
    results_tree.write_html("html/results_tree.html")
    results_chart.write_html("html/results_chart.html")
    # result_details.write_html("html/result_details.html")
