#!/usr/bin/env python
# %% imports
import warnings
from datetime import datetime

import dash_bootstrap_components as dbc
import plotly.express as px
import plotly.graph_objects as go
import postman_reporter.report_charts as report_charts
import postman_reporter.reporter_util as reporter_util
from dash import Dash
from dash import dash_table
from dash import dcc
from dash import html
from postman_reporter.report_config import *

warnings.filterwarnings("ignore")


def getApp():
    # %% setup
    df = reporter_util.get_dataframes()
    now = str(datetime.now())

    # %% main components
    # sidebar = report_charts.getSidebar()

    # %% charts
    summaryText = report_charts.getSummaryText(df["df_summary_provider"], now)
    summaryProvider, summaryProviderMulti = report_charts.getCards(
        df["df_summary_provider"]
    )
    facet_tests = report_charts.getFacet(df["df_inter"])
    results_chart = report_charts.getSunburst(df["df_details"])
    results_tree = report_charts.getTree(
        df["df_details"], path=["Provider", "Test Type", "Test Step"]
    )

    # %% setup content
    overview = [dbc.Col([], xl="12")]
    summary = [
        dbc.Col(
            [
                html.H2("Summary"),
                html.Div(
                    summaryText, style={"margin-bottom": "3em", "font-size": "1.2em"}
                ),
                html.H3("Provider Summary"),
                html.Div(summaryProvider, style={"margin-bottom": "2em"}),
                html.Div(summaryProviderMulti, style={"margin-bottom": "3em"}),
                html.H3("Provider & Test Summary"),
                html.Div(
                    [
                        report_charts.getTable(
                            df["df_crosstab_results"], "summary-test-crosstab"
                        )
                    ],
                    style={"width": "60%"},
                ),
                html.Br(),
                html.Div(
                    [
                        report_charts.getTable(
                            df["df_crosstab_results_multi"],
                            "summary-test-crosstab-multi",
                        )
                    ],
                    style={"width": "80%"},
                ),
                html.Br(),
                html.Br(),
                html.Div(
                    [
                        dcc.Graph(
                            id="test-facets",
                            figure=facet_tests,
                            config={"displayModeBar": False},
                        )
                    ]
                ),
                # getTable(df_summary_test, 'summary-test'),
                html.Br(),
            ],
            xl="12",
        )
    ]
    results = [
        dbc.Col(
            [
                html.H2("Results"),
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                dcc.Graph(
                                    id="chart-tests",
                                    figure=results_chart,
                                    config={"displayModeBar": False},
                                ),
                            ],
                            xl="6",
                        ),
                        dbc.Col(
                            [
                                dcc.Graph(
                                    id="chart-tests-tree",
                                    figure=results_tree,
                                    config={"displayModeBar": False},
                                ),
                            ],
                            xl="6",
                        ),
                    ]
                ),
            ],
            xl="12",
        )
    ]
    details = [
        dbc.Col(
            [
                html.H2("Details"),
                html.Div(
                    [
                        report_charts.getTable(
                            df["df_main"], "results-table", filter=True
                        )
                    ],
                    style={"width": "100%", "max-width": "100%"},
                ),
            ],
            xl="12",
        )
    ]

    # %% layout
    content = html.Div(
        id="page-content",
        style=CONTENT_STYLE,
        children=[
            dbc.Row(
                [
                    html.H1("Trace Interop Test Results"),
                ]
            ),
            dbc.Row(
                [
                    dbc.Col(
                        [
                            dbc.Row(
                                id="overview",
                                children=overview,
                                style={"margin-bottom": "3em"},
                            ),
                            dbc.Row(
                                id="summary",
                                children=summary,
                                style={"margin-bottom": "3em"},
                            ),
                            dbc.Row(
                                id="results",
                                children=results,
                                style={"margin-bottom": "3em"},
                            ),
                            dbc.Row(
                                id="details",
                                children=details,
                                style={"margin-bottom": "3em"},
                            ),
                        ],
                        xl="12",
                    )
                ]
            ),
        ],
    )

    # %% setup dash
    app = Dash(
        title="Traceability Interop Test Results",
        external_stylesheets=[dbc.themes.DARKLY],
    )
    app.index_string = reporter_util.get_html_base()
    app.layout = html.Div([dcc.Location(id="url"), content])

    return app


# %% main it up
if __name__ == "__main__":
    app = getApp()
    # print(app.layout)
    app.run_server()
