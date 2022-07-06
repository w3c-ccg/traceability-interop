#!/usr/bin/env python
from datetime import datetime

import plotly
import postman_reporter.report_charts as report_charts
import postman_reporter.reporter_util as reporter_util
from jinja2 import Template
from postman_reporter.report_config import *


def generate_html(template):
    df = reporter_util.get_dataframes()
    crosstabDF = df["df_crosstab_results"]
    crosstabMultiDF = df["df_crosstab_results_multi"]
    detailsDF = df["df_details"]
    summaryDF = df["df_summary_provider"]

    facet_tests = report_charts.getFacet(df["df_inter"])
    results_chart = report_charts.getSunburst(detailsDF)
    results_tree = report_charts.getTree(
        detailsDF, path=["Provider", "Test Type", "Test Step"]
    )

    # Change percentage strings to floats for processing
    summaryDF["Passing"] = summaryDF["Passing"].str.rstrip("%").astype("float") / 100.0

    cards = renderSummaryCards(summaryDF)

    args = {"include_plotlyjs": False, "output_type": "div"}
    rendered = template.render(
        summary_text=renderSummaryText(summaryDF),
        cards_single=cards["single"],
        cards_multi=cards["multi"],
        summary_table_single=renderTable(crosstabDF),
        summary_table_multi=renderTable(crosstabMultiDF),
        facet_tests=plotly.offline.plot(facet_tests, **args),
        results_chart=plotly.offline.plot(results_chart, **args),
        results_tree=plotly.offline.plot(results_tree, **args),
        details=renderTable(detailsDF),
    )

    with open(f"{CI_DIR}/index.html", "wt") as fh:
        fh.write(rendered)


def renderTable(df):
    tpl = Template(
        """
        <div class="dash-table-container" style="position: relative">
          <div class="dash-spreadsheet-menu"><div></div></div>
          <div class="dash-spreadsheet-container dash-spreadsheet dash-empty-01 dash-no-filter dash-fill-width" style="width: 100%">
            <div class="dash-spreadsheet-inner dash-spreadsheet dash-empty-01 dash-no-filter dash-fill-width" style="min-height: 100%; min-width: 100%">
              <div class="dt-table-container__row dt-table-container__row-0">
                <div class="cell cell-0-0"></div>
                <div class="cell cell-0-1" style="margin-right: 15px; margin-left: -0.5px"></div>
              </div>
              <div class="dt-table-container__row dt-table-container__row-1">
                <div class="cell cell-1-0"></div>
                <div class="cell cell-1-1 dash-fixed-content" style="margin-left: -0.5px">
                  <table class="cell-table" tabindex="-1">
                    <tbody>
                      <tr>
                        {% for cell in columns -%}
                        <th class="dash-header column-0"
                          style="
                            padding: 2px;
                            text-align: center;
                            max-width: 220px;
                            background-color: rgb(30, 30, 30);
                            color: white;
                            border-bottom: none;
                            border-top: 1px solid rgb(30, 30, 30);
                            border-left: 1px solid rgb(30, 30, 30);
                            border-right: 1px solid rgb(30, 30, 30);
                            overflow-x: hidden;
                          "
                        >
                          <div>
                            <span class="column-header-name" style="white-space:nowrap;">{{cell}}</span>
                          </div>
                        </th>
                        {% endfor -%}
                      </tr>
                      {%for row in rows -%}
                      <tr style="background-color: {{ loop.cycle('rgb(39, 43, 48)', 'rgb(49, 53, 58)') }};">
                        {% for cell in row -%}
                        <td
                          tabindex="-1"
                          class="dash-cell column-0"
                          style="
                            padding: 2px;
                            text-align: left;
                            max-width: 220px;
                            color: white;
                            border-width: 1px;
                            border-style: solid;
                            border-color: rgb(30, 30, 30);
                            overflow-x: hidden;
                          "
                        >
                          <div class="unfocused dash-cell-value cell-markdown">
                            <p style="white-space:nowrap;">{{cell}}</p>
                          </div>
                        </td>
                        {% endfor -%}
                      </tr>
                      {% endfor -%}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        """
    )

    return tpl.render(
        columns=df.columns,
        rows=df.values,
    )


def renderSummaryText(df):

    tpl = """
        <p>
            These are the test results for the
            <a href="https://w3id.org/traceability/interoperability" target="_blank">Traceability Interop Profile</a>
            as of: {now}
        </p>
        <p>
            The highest current % of passed tests by a single provider is: {max:.1%}<br>
            The lowest is: {min:.1%}<br>
            Across all providers the average % of passed tests is: {avg:.1%}
        </p>
    """

    return tpl.format(
        now=datetime.now(),
        min=df["Passing"].min(),
        max=df["Passing"].max(),
        avg=df["Passing"].mean(),
    )


def renderSummaryCards(df):

    tpl = """
      <div style="display: inline-block;">
        <div class="card">
          <div class="card-header">{header}</div>
          <div class="card-body">
            <h4 class="card-title">{passed:.1%}</h4>
            <p class="card-text">of tests taken, passed</p>
          </div>
        </div>
      </div>
    """

    single = []
    for _, r in df[~df["Provider"].str.contains(" - ")].iterrows():
        single.append(tpl.format(header=r["Provider"], passed=r["Passing"]))

    multi = []
    for _, r in df[df["Provider"].str.contains(" - ")].iterrows():
        multi.append(tpl.format(header=r["Provider"], passed=r["Passing"]))

    return {"single": single, "multi": multi}
