URL = "https://w3id.org/traceability/interoperability/reports/"
TEMPLATE_FILE = "./assets/template.j2"
DATA_DIR = "./data/"
CI_DIR = "../docs/reports"
DF_PREFIX = ""
DF_EXT = ".pkl"

HEADER = [
    "Testing Application",
    "Project Name",
    "Provider",
    "Test Type",
    "Test Step",
    "Assertion",
    "Result",
    "Error Message",
    "Passing",
]

COLUMNS_DETAIL = [
    "Provider",
    "Test Type",
    "Test Step",
    "Assertion",
    "Result",
    "Error Message",
    "Passing",
]

COLUMNS_MAIN = [
    "Provider",
    "Test Type",
    "Test Step",
    "Assertion",
    "Result",
    "Error Message",
]

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

COLOR_MAP = {
    "(?)": "darkgoldenrod",
    "Pass": "darkgreen",
    "Fail": "darkred",
    "Fail (Partial)": "darkgoldenrod",
}

DEFAULT_REPORT_PATH = ["Test Type", "Provider", "Test Step"]
