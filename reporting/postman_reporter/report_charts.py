import plotly.express as px
import plotly.graph_objects as go
import dash_bootstrap_components as dbc
from dash import html, dash_table
from postman_reporter.report_config import *


def getSidebar():
    html.Div(
        [
            html.H2("Trace Interop", className="display-4"),
            html.Hr(),
            html.P(
                "CI/CD Testing", className="lead"
            ),
            dbc.Nav(
                [
                    dbc.NavLink("Home", href="#overview"),
                    dbc.NavLink("Summary", href="#summary"),
                    dbc.NavLink("Results", href="#results"),
                    dbc.NavLink("Details", href="#details"),
                ],
                vertical=True,
                pills=True,
            ),
        ],
        style=SIDEBAR_STYLE,
    )


def getSummaryText(df, now):
    return [
        html.P([
            "These are the test results for the ",
            html.A("Open API for Interoperable Traceability",
                   href="https://w3id.org/traceability/interoperability", target="_blank"),
            " as of:" + now
        ]),
        html.P([
            "The highest current % of passed tests by a single provider is: ", str(
                df['Passing'].min()),
            html.Br(),
            "The lowest is: ", str(df['Passing'].max()),
            html.Br(),
            "Across all providers the average % of passed tests is: ", "{:.1%}".format(
                df['Passing'].str.replace("\%", "").astype(float).mean()/100),
        ])
    ]


def getTable(d, id, filter=False):
    df_dict = d.to_dict('records')
    tbl = None
    if filter:
        tbl = dash_table.DataTable(
            id=id,
            columns=[
                {"name": i, "id": i, "deletable": False,
                    "selectable": False, 'presentation': 'markdown'}
                for i in d.columns
            ],
            data=df_dict,
            style_cell=dict(
                textAlign='left',
                backgroundColor='rgb(39, 43, 48)',
                color='white'
            ),
            style_header=dict(
                textAlign='center',
                backgroundColor='rgb(30, 30, 30)',
                color='white',
                border='1px solid rgb(30, 30, 30)'
            ),
            style_data={
                'border': '1px solid rgb(30, 30, 30)',
                'whiteSpace': 'normal',
                'height': 'auto',
                'lineHeight': '1em'
            },
            style_data_conditional=[
                {
                    'if': {'row_index': 'odd'},
                    'backgroundColor': 'rgb(49, 53, 58)',
                }
            ],
            editable=False,
            row_selectable=False,
            column_selectable=False,
            cell_selectable=False,
            sort_action="native",
            filter_action="native",
            page_size=1000,
        )
    else:
        tbl = dash_table.DataTable(
            id=id,
            columns=[
                {"name": i, "id": i, "deletable": False,
                    "selectable": False, 'presentation': 'markdown'}
                for i in d.columns
            ],
            data=df_dict,
            style_cell=dict(
                textAlign='left', maxWidth="220px",
                overflow="ellipsis",
                backgroundColor='rgb(39, 43, 48)',
                color='white'
            ),
            style_header=dict(
                textAlign='center',
                backgroundColor='rgb(30, 30, 30)',
                color='white',
                border='1px solid rgb(30, 30, 30)',
            ),
            style_data={'border': '1px solid rgb(30, 30, 30)'},
            style_data_conditional=[
                {
                    'if': {'row_index': 'odd'},
                    'backgroundColor': 'rgb(49, 53, 58)',
                }
            ],
            editable=False,
            row_selectable=False,
            column_selectable=False,
            cell_selectable=False,
            sort_action="native",
            page_size=1000,
        )
    return tbl


def df_to_heatmap(d, idx):
    dd = d.copy()
    dd.set_index(idx)
    return {
        'z': d.values.tolist(),
        'x': d.columns.tolist(),
        'y': d.index.tolist()
    }


def getCards(df):
    summaryProvider = []
    for idx, r in df.iterrows():
        if ' - ' not in r[0]:
            summaryProvider.append(
                html.Div([
                    dbc.Card(
                        [
                            dbc.CardHeader(r[0]),
                            dbc.CardBody(
                                [
                                    html.H4(r[1], className="card-title"),
                                    html.P("of tests taken, passed",
                                           className="card-text"),
                                ]
                            ),
                        ],
                    )], style={"display": "inline-block"})
            )

    summaryProviderMulti = []
    for idx, r in df.iterrows():
        if ' - ' in r[0]:
            summaryProviderMulti.append(
                html.Div([
                    dbc.Card(
                        [
                            dbc.CardHeader(r[0]),
                            dbc.CardBody(
                                [
                                    html.H4(r[1], className="card-title"),
                                    html.P("of tests taken, passed",
                                           className="card-text"),
                                ]
                            ),
                        ],
                    )], style={"display": "inline-block"})
            )
    return summaryProvider, summaryProviderMulti


def getFacet(df):
    facet_tests = px.scatter(
        df,
        y='Test Step', color='Result',
        x='Provider',
        facet_col='Test Type',
        size='Size', size_max=12,
        symbol='Shape', symbol_sequence=['square'],
        color_discrete_map=COLOR_MAP,
    )

    facet_tests.update_layout(
        showlegend=False,
        height=1200,
        font_size=12,
        font_color='white',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        margin=dict(
            l=0,
            r=0,
            b=0,
            t=220,
            pad=0
        )
    )
    facet_tests.update_xaxes(showgrid=False)
    facet_tests.update_yaxes(showgrid=False, autorange="reversed")
    facet_tests.update_annotations(font=dict(size=12))
    facet_tests.for_each_annotation(
        lambda a: a.update(text=a.text.split("=")[-1]))
    for annotation in facet_tests['layout']['annotations']:
        annotation['textangle'] = 60
        annotation['font'].size = 14
        # annotation['textposition']= 'bottom' # would like this flipped with x-axis

    for axis in facet_tests.layout:
        if type(facet_tests.layout[axis]) == go.layout.YAxis:
            facet_tests.layout[axis].title.text = ''
        if type(facet_tests.layout[axis]) == go.layout.XAxis:
            facet_tests.layout[axis].title.text = ''
            facet_tests.layout[axis].tickangle = 60
    return facet_tests


def getSunburst(df, path=DEFAULT_REPORT_PATH, color="Result"):
    subburst = px.sunburst(
        df,
        path=path,
        color=color,
        color_discrete_map=COLOR_MAP,
    )

    subburst.update_layout(
        height=725,
        font_size=12,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        margin=dict(
            l=0,
            r=0,
            b=0,
            t=40,
            pad=0
        ),
    )
    return subburst


def getTree(df, path=DEFAULT_REPORT_PATH, color="Result"):
    tree = px.treemap(
        df,
        path=path,
        color=color,
        color_discrete_map=COLOR_MAP,
    )
    tree.update_layout(
        height=725,
        font_size=12,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        margin=dict(
            l=0,
            r=0,
            b=0,
            t=40,
            pad=0
        ),
    )
    return tree
