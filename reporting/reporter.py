#!/usr/bin/env python
# %% imports
from datetime import datetime
import json
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import dash_bootstrap_components as dbc
from dash import Dash, html, dcc, dash_table
import warnings
warnings.filterwarnings('ignore')

# %% setup
URL = "https://w3id.org/traceability/interoperability/reports/"
url = requests.get(URL)

# %% process initial json
data = json.loads(url.text)

# %% loop and get each report and assign to provider from url
items = data['items']
report_sources = []
for item in items:
    if '.json' in item:
        report_sources.append(item)

header = [
    'Testing Application',
    'Project Name',
    'Provider',
    'Test Type',
    'Test Step',
    'Assertion',
    'Result',
    'Error Message',
    'Passing'
]
reports = []


def build_detail(args, execution, assertion):
    if 'error' not in assertion:
        return [
            'postman',
            args['projectname'],
            args['provider'],
            args['testtype'],
            execution['item']['name'],
            assertion['assertion'],
            'Pass',
            "",
            1,
        ]
    else:
        return [
            'postman',
            args['projectname'],
            args['provider'],
            args['testtype'],
            execution['item']['name'],
            assertion['assertion'],
            'Fail',
            assertion['error']['message'],
            0
        ]


# %% set up dataframe(s)
for report_source in report_sources:
    rs = report_source.replace('.json', '')
    provider = rs.rsplit('-', 1)[1]
    if 'exchange' in report_source:
        provider = ' - '.join(rs.split("-")[-2:])
    report = json.loads(requests.get(report_source).text)
    name = report['collection']['info']['name']
    print(provider, name)
    for execution in report['run']['executions']:
        args = {}
        args['provider'] = provider
        args['projectname'] = "Trace Interop"
        args['testtype'] = name
        if 'assertions' not in execution:
            print('No assertions found in execution ' +
                  execution['item']['name'])
            continue

        for assertion in execution['assertions']:
            detail = build_detail(args, execution, assertion)
            # print(detail)
            reports.append(detail)


# %% clean it up
df = pd.DataFrame(reports, columns=header)

df.to_csv('./data/full_report.csv', index=False,
          quoting=1, quotechar="'", sep="|")
with open('./data/full_results.json', 'w') as out:
    out.write(json.dumps(reports, indent=2))

df = df.loc[df['Provider'] != 'sanity']
df['Test Type'] = df['Test Type'].str.replace(' Tutorial', '')

df_details = df[[
    'Provider',
    'Test Type',
    'Test Step',
    'Assertion',
    'Result',
    'Error Message',
    'Passing'
]].copy()
df = df[[
    'Provider',
    'Test Type',
    'Test Step',
    'Assertion',
    'Result',
    'Error Message',
]].copy()

df_failed = df_details.loc[df_details['Result'] == 'Fail'].copy()

# %% groupings
df_inter = df_details[['Provider', 'Test Type', 'Test Step', 'Result']]
df_summary_test = df_details.groupby(['Test Type', 'Provider'])[
    'Passing'].mean().apply(lambda x: "{:.1%}".format(x)).unstack('Test Type').fillna('0%').reset_index()
df_summary_provider = df_details.groupby(
    ['Provider'])['Passing'].mean().fillna(0).reset_index()

# df_summary_test.columns = ['Test Type', 'Provider', 'Passing']
# df_summary_provider.columns = ['Provider', 'Passing']

# df_summary_test['Passing'] = df_summary_test['Passing']
# df_summary_test = df_summary_test.sort_values(
#     ['Test Type', 'Provider'], ascending=True)
df_summary_provider['Passing'] = df_summary_provider['Passing'].apply(
    lambda x: "{:.1%}".format(x))
df_summary_provider = df_summary_provider.sort_values(
    ['Provider'], ascending=True)

df_singles = df_details.loc[~df_details['Provider'].str.contains(' - ')].copy()
df_multi = df_details.loc[df_details['Provider'].str.contains(' - ')].copy()

crosstab_results = df_singles.groupby(['Test Type', 'Provider'])['Passing'].mean(
).round(3).apply(lambda x: "{:.1%}".format(x)).unstack().fillna('n/a').reset_index()

crosstab_results_multi = df_multi.groupby(['Test Type', 'Provider'])['Passing'].mean(
).round(3).apply(lambda x: "{:.1%}".format(x)).unstack().fillna('n/a').reset_index()


# %% useful comps
now = str(datetime.now())
summaryText = [
    html.P([
        "These are the test results for the ",
        html.A("Traceability Interop Profile",
               href="https://w3c-ccg.github.io/traceability-interop/", target="_blank"),
        " as of:" + now
    ]),
    html.P([
        "The highest current % of passed tests by a single provider is: ", str(
            df_summary_provider['Passing'].max()),
        html.Br(),
        "The lowest is: ", str(df_summary_provider['Passing'].min()),
        html.Br(),
        "Across all providers the average % of passed tests is: ", "{:.1%}".format(
            df_summary_provider['Passing'].str.replace("\%", "").astype(float).mean()/100),
    ])
]

# %% setup dash
SIDEBAR_STYLE = {
    "position": "fixed",
    "top": 0,
    "left": 0,
    "bottom": 0,
    "width": "16rem",
    "padding": "2rem 1rem",
    # "background-color": "#f8f9fa",
}
CONTENT_STYLE = {
    "margin-left": "18rem",
    "margin-right": "2rem",
    "padding": "2rem 1rem",
}

app = Dash(
    title="Traceability Interop Test Results",
    external_stylesheets=[dbc.themes.DARKLY]
)

# %% main components
sidebar = html.Div(
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

# %% charts


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
            # tooltip_data=[
            #     {
            #         column: {'value': str(value), 'type': 'markdown'}
            #         for column, value in row.items()
            #     } for row in df_dict
            # ],
            style_cell=dict(
                textAlign='left',
                # maxWidth="220px",
                # overflow="ellipsis",
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
            # style_as_list_view=True,
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
            # tooltip_data=[
            #     {
            #         column: {'value': str(value), 'type': 'markdown'}
            #         for column, value in row.items()
            #     } for row in df_dict
            # ],
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
            # style_as_list_view=True,
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


summaryProvider = []
for idx, r in df_summary_provider.iterrows():
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
for idx, r in df_summary_provider.iterrows():
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

results_chart = px.sunburst(
    df_details,
    path=["Test Type",  "Provider", "Test Step"],
    color="Result",
    color_discrete_map={
        '(?)': 'darkred', 'Pass': 'darkgreen', 'Fail': 'darkred'},
)
results_tree = px.treemap(
    df_details,
    path=["Test Type",  "Provider", "Test Step"],
    color="Result",
    color_discrete_map={
        '(?)': 'darkred', 'Pass': 'darkgreen', 'Fail': 'darkred'},
)

df_inter['Size'] = 18
df_inter['Shape'] = 'Box'
df_inter_full = df_inter.copy()
df_inter = df_inter.loc[~df_inter['Provider'].str.contains(' - ')].copy()
facet_tests = px.scatter(
    df_inter,
    y='Test Step', color='Result',
    x='Provider',
    facet_col='Test Type',
    size='Size',
    symbol='Shape', symbol_sequence=['square'],
    color_discrete_map={
        '(?)': 'darkred', 'Pass': 'darkgreen', 'Fail': 'darkred'},
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
# matches=None, showticklabels=False, visible=True
facet_tests.update_yaxes(showgrid=False, autorange="reversed")
facet_tests.update_annotations(font=dict(size=12))
facet_tests.for_each_annotation(lambda a: a.update(text=a.text.split("=")[-1]))
for annotation in facet_tests['layout']['annotations']:
    annotation['textangle'] = 60
    annotation['font'].size = 14
    # annotation['textposition']= 'bottom' # would like this flipped with x-axis

for axis in facet_tests.layout:
    if type(facet_tests.layout[axis]) == go.layout.YAxis:
        facet_tests.layout[axis].title.text = ''
    if type(facet_tests.layout[axis]) == go.layout.XAxis:
        facet_tests.layout[axis].title.text = ''
        # facet_tests.layout[axis].font_size = 14
        facet_tests.layout[axis].tickangle = 60
        # facet_tests.layout[axis].position = 'top'

results_chart.update_layout(
    height=725,
    font_size=10,
    # font_color='white',
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
results_tree.update_layout(
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

# %% setup content
overview = [
    dbc.Col([
    ], xl="12")
]
summary = [
    dbc.Col([
        html.H2("Summary"),
        html.Div(summaryText, style={
                 "margin-bottom": "3em", "font-size": "1.2em"}),
        html.H3("Provider Summary"),
        html.Div(summaryProvider, style={"margin-bottom": "2em"}),
        html.Div(summaryProviderMulti, style={"margin-bottom": "3em"}),
        html.H3("Provider & Test Summary"),
        html.Div([
            getTable(crosstab_results, 'summary-test-crosstab')
        ], style={"width": "60%"}),
        html.Br(),
        html.Div([
            getTable(crosstab_results_multi, 'summary-test-crosstab-multi')
        ], style={"width": "80%"}),
        html.Br(),
        html.Br(),
        html.Div([
            dcc.Graph(
                id="test-facets",
                figure=facet_tests,
                config={'displayModeBar': False}
            )
        ]),
        # getTable(df_summary_test, 'summary-test'),
        html.Br(),
    ], xl="12")
]
results = [
    dbc.Col([
        html.H2("Results"),
        dbc.Row([
            dbc.Col([
                dcc.Graph(id="chart-tests", figure=results_chart,
                          config={'displayModeBar': False}),
            ], xl="6"),
            dbc.Col([
                dcc.Graph(id="chart-tests-tree", figure=results_tree,
                          config={'displayModeBar': False}),
            ], xl="6"),
        ]),
    ], xl="12")
]
details = [
    dbc.Col([
        html.H2("Details"),
        html.Div([
            getTable(df, 'results-table', filter=True)
        ], style={"width": "100%", "max-width": "100%"})
    ], xl="12")
]

# %% layout
content = html.Div(
    id="page-content", style=CONTENT_STYLE,
    children=[
        dbc.Row([dbc.Col([
            dbc.Row(id="overview", children=overview,
                style={"margin-bottom": "3em"}),
            dbc.Row(id="summary", children=summary,
                style={"margin-bottom": "3em"}),
            dbc.Row(id="results", children=results,
                style={"margin-bottom": "3em"}),
            dbc.Row(id="details", children=details,
                style={"margin-bottom": "3em"}),
        ], xl="12")]),
    ]
)

app.layout = html.Div([dcc.Location(id="url"), sidebar, content])


# %% main it up
if __name__ == "__main__":
    app.run_server()
