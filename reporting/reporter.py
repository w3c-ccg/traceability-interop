#!/usr/bin/env python
# %% imports
from datetime import datetime
import json
from sys import meta_path
from time import time
from click import style
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import dash_bootstrap_components as dbc
from dash import Dash, html, dcc, dash_table
import warnings
warnings.filterwarnings('ignore')

# %% setup
URL = "https://w3c-ccg.github.io/traceability-interop/reports/"
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
    'Result Numeric'
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
    provider = report_source.rsplit('-', 1)[1].replace('.json', '')
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
    'Result Numeric'
]].copy()
df = df[[
    'Provider',
    'Test Type',
    'Test Step',
    'Assertion',
    'Result',
    'Error Message',
]].copy()

df_summary_test = df_details.groupby(['Test Type', 'Provider'])[
    'Result Numeric'].mean().reset_index()
df_summary_provider = df_details.groupby(
    ['Provider'])['Result Numeric'].mean().reset_index()

df_summary_test.columns = ['Test Type', 'Provider', 'Passing']
df_summary_provider.columns = ['Provider', 'Passing']

df_summary_test['Passing'] = df_summary_test['Passing'].apply(
    lambda x: "{:.1%}".format(x))
df_summary_provider['Passing'] = df_summary_provider['Passing'].apply(
    lambda x: "{:.1%}".format(x))
df_summary_test = df_summary_test.sort_values(
    ['Test Type', 'Provider'], ascending=True)
df_summary_provider = df_summary_provider.sort_values(
    ['Provider'], ascending=True)

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

crosstab_results = df_details.groupby(['Test Type', 'Provider'])['Result Numeric'].mean(
).round(3).apply(lambda x: "{:.1%}".format(x)).unstack().reset_index()

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
            tooltip_data=[
                {
                    column: {'value': str(value), 'type': 'markdown'}
                    for column, value in row.items()
                } for row in df_dict
            ],
            style_cell=dict(
                textAlign='left', maxWidth="220px",
                overflow="ellipsis",
                backgroundColor='rgb(39, 43, 48)',
                color='white'
            ),
            style_header=dict(
                backgroundColor='rgb(30, 30, 30)',
                color='white'
            ),
            editable=False,
            row_selectable=False,
            column_selectable=False,
            cell_selectable=False,
            sort_action="native",
            filter_action=filter,
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
            tooltip_data=[
                {
                    column: {'value': str(value), 'type': 'markdown'}
                    for column, value in row.items()
                } for row in df_dict
            ],
            style_cell=dict(
                textAlign='left', maxWidth="220px",
                overflow="ellipsis",
                backgroundColor='rgb(39, 43, 48)',
                color='white'
            ),
            style_header=dict(
                backgroundColor='rgb(30, 30, 30)',
                color='white'
            ),
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

def genSankey(d, cat_cols=[], value_cols=''):
        # maximum of 6 value cols -> 6 colors
        colorPalette = [
            '#B80C09','#0B4F6C','#01BAEF','#FBFBFF','#040F16', '#495867', '#C18C5D','#76BED0','#F7CB15','#F55D3E',
            '#247BA0', '#1F487E', '#1D3461', '#605F5E', '#FB3640'
        ]
        labelList = []
        colorNumList = []
        for catCol in cat_cols:
            labelListTemp =  list(set(d[catCol].values))
            colorNumList.append(len(labelListTemp))
            labelList = labelList + labelListTemp
            
        # remove duplicates from labelList
        labelList = list(dict.fromkeys(labelList))
        
        # define colors based on number of levels
        colorList = []
        for idx, colorNum in enumerate(colorNumList):
            # colorList = colorList + [colorPalette[idx]]*colorNum
            colorList = colorList + [colorPalette[idx]]*colorNum
            
        # transform df into a source-target pair
        for i in range(len(cat_cols)-1):
            if i==0:
                sourceTargetDf = d[[cat_cols[i],cat_cols[i+1],value_cols]]
                sourceTargetDf.columns = ['source','target','count']
            else:
                tempDf = d[[cat_cols[i],cat_cols[i+1],value_cols]]
                tempDf.columns = ['source','target','count']
                sourceTargetDf = pd.concat([sourceTargetDf,tempDf])
            sourceTargetDf = sourceTargetDf.groupby(['source','target']).agg({'count':'sum'}).reset_index()
            
        # add index for source-target pair
        sourceTargetDf['sourceID'] = sourceTargetDf['source'].apply(lambda x: labelList.index(x))
        sourceTargetDf['targetID'] = sourceTargetDf['target'].apply(lambda x: labelList.index(x))
        
        fig = go.Figure(data=[
            go.Sankey(
                node = dict(
                    pad = 0.75,
                    thickness = 45,
                    line = dict(
                        color = "black",
                        width = .25
                    ),
                    label = labelList,
                    color = colorList
                ),
                link = dict(
                    source = sourceTargetDf['sourceID'],
                    target = sourceTargetDf['targetID'],
                    value = sourceTargetDf['count']
                )
            )
        ])
        return fig

summaryProvider = []
for idx, r in df_summary_provider.iterrows():
    summaryProvider.append(
        html.Div([
            dbc.Card(
                [
                    dbc.CardHeader(r[0]),
                    dbc.CardBody(
                        [
                            html.H4(r[1], className="card-title"),
                            html.P("of tests passed", className="card-text"),
                        ]
                    ),
                ],
            )], style={"display": "inline-block"})
    )

results_chart = px.sunburst(
    df_details, 
    path=["Result", "Test Type",  "Provider", "Test Step"]
)



results_flow = genSankey(
    df_details[["Provider", "Test Type",  "Result", "Test Step", "Result Numeric"]],
    cat_cols=["Provider", "Test Type", "Test Step", "Result"],
    value_cols='Result Numeric'
)

results_chart.update_layout(
    height=725,
    font_size=10,
    margin=dict(
        l=0,
        r=0,
        b=0,
        t=40,
        pad=0
    ),
)

results_flow.update_layout(
    height=1225,
    font_size=10,
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
        html.H1("Traceability Interop"),
        html.Div("")
    ], xl="12")
]
summary = [
    dbc.Col([
        html.H2("Summary"),
        html.Div(summaryText, style={"margin-bottom": "3em"}),
        html.H3("Provider Summary"),
        html.Div(summaryProvider, style={"margin-bottom": "3em"}),
        html.H3("Provider & Test Summary"),
        html.Div([
            getTable(crosstab_results, 'summary-test-crosstab')
        ], style={"width": "60%"}),
        html.Br(),
        getTable(df_summary_test, 'summary-test'),
        html.Br(),
    ], xl="12")
]
results = [
    dbc.Col([
        html.H2("Results"),
        dcc.Graph(id="chart-tests", figure=results_chart),
        # html.Br(),
        # dcc.Graph(id="chart-flow", figure=results_flow),
    ], xl="12")
]
details = [
    dbc.Col([
        html.H2("Details"),
        getTable(df, 'results-table', filter=True)
    ], xl="12")
]

# %% layout
content = html.Div(
    id="page-content", style=CONTENT_STYLE,
    children=[
        dbc.Row(id="overview", children=overview,
                style={"margin-bottom": "3em"}),
        dbc.Row(id="summary", children=summary,
                style={"margin-bottom": "3em"}),
        dbc.Row(id="results", children=results,
                style={"margin-bottom": "3em"}),
        dbc.Row(id="details", children=details,
                style={"margin-bottom": "3em"}),
    ]
)

app.layout = html.Div([dcc.Location(id="url"), sidebar, content])

# %% main it up
if __name__ == "__main__":
    app.run_server()
