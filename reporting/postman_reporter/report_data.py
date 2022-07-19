#!/usr/bin/env python
# %% imports
import json
import warnings
from datetime import datetime

import pandas as pd

# disable warnings
warnings.filterwarnings("ignore")
import postman_reporter.reporter_util as reporter_util
from postman_reporter.report_config import *
from tqdm import tqdm

# %% setup
tqdm.pandas()


# %% process initial json
def getData(get_reports, get_json):

    report_sources = get_reports()

    def build_detail(args, execution, assertion):
        if "error" not in assertion:
            return [
                "postman",
                args["projectname"],
                args["provider"],
                args["testtype"],
                execution["item"]["name"],
                assertion["assertion"],
                "Pass",
                "",
                1,
            ]
        else:
            return [
                "postman",
                args["projectname"],
                args["provider"],
                args["testtype"],
                execution["item"]["name"],
                assertion["assertion"],
                "Fail",
                assertion["error"]["message"],
                0,
            ]

    reports = []
    print("Processing identified reports:", len(report_sources))
    report_sources_progress = tqdm(report_sources)
    for report_source in report_sources_progress:
        rs = report_source.replace(".json", "")
        provider = rs.rsplit("-", 1)[1]
        if "exchange" in report_source:
            provider = " - ".join(rs.split("-")[-2:])
        report = get_json(report_source)
        name = report["collection"]["info"]["name"]
        report_sources_progress.set_description_str(provider + ": " + name)

        for execution in report["run"]["executions"]:
            args = {}
            args["provider"] = provider
            args["projectname"] = "Trace Interop"
            args["testtype"] = name
            if "assertions" not in execution:
                print("No assertions found in execution " + execution["item"]["name"])
                continue

            for assertion in execution["assertions"]:
                detail = build_detail(args, execution, assertion)
                # print(detail)
                reports.append(detail)

    # %% persist raw data
    print("Persisting raw fetched data")
    df_main = pd.DataFrame(reports, columns=HEADER)
    # use pipe separation bc of commas and other nastys
    df_main.to_csv(
        DATA_DIR + "full_report.csv", index=False, quoting=1, quotechar="'", sep="|"
    )
    with open(DATA_DIR + "full_report.json", "w") as out:
        out.write(json.dumps(reports, indent=2))

    # %% clean it up
    print("Processing data")
    df_main = df_main.loc[df_main["Provider"] != "sanity"]
    df_main["Test Type"] = df_main["Test Type"].str.replace(" Tutorial", "")

    df_details = df_main[COLUMNS_DETAIL].copy()
    df_main = df_main[COLUMNS_MAIN].copy()

    df_failed = df_details.loc[df_details["Result"] == "Fail"].copy()

    # %% groupings
    df_inter = df_details[["Provider", "Test Type", "Test Step", "Passing"]]
    df_inter = df_inter.loc[~df_inter["Provider"].str.contains(" - ")].copy()

    df_inter_full = df_details[["Provider", "Test Type", "Test Step", "Passing"]].copy()
    df_inter_full["Size"] = 12
    df_inter_full["Shape"] = "Box"

    df_summary_test = (
        df_details.groupby(["Test Type", "Provider"])["Passing"]
        .mean()
        .apply(lambda x: "{:.1%}".format(x))
        .unstack("Test Type")
        .fillna("0%")
        .reset_index()
    )
    df_summary_provider = (
        df_details.groupby(["Provider"])["Passing"].mean().fillna(0).reset_index()
    )

    df_summary_provider["Passing"] = df_summary_provider["Passing"].apply(
        lambda x: "{:.1%}".format(x)
    )
    df_summary_provider = df_summary_provider.sort_values(["Provider"], ascending=True)

    df_singles = df_details.loc[~df_details["Provider"].str.contains(" - ")].copy()
    df_multi = df_details.loc[df_details["Provider"].str.contains(" - ")].copy()

    df_crosstab_results = (
        df_singles.groupby(["Test Type", "Provider"])["Passing"]
        .mean()
        .round(3)
        .apply(lambda x: "{:.1%}".format(x))
        .unstack()
        .fillna("n/a")
        .reset_index()
    )

    df_crosstab_results_multi = (
        df_multi.groupby(["Test Type", "Provider"])["Passing"]
        .mean()
        .round(3)
        .apply(lambda x: "{:.1%}".format(x))
        .unstack()
        .fillna("n/a")
        .reset_index()
    )

    # %% save results
    print("Saving data frames")
    reporter_util.save_dataframes(
        [
            {"name": "df_main", "data": df_main},
            {"name": "df_failed", "data": df_failed},
            {"name": "df_details", "data": df_details},
            {"name": "df_inter_full", "data": df_inter_full},
            {"name": "df_inter", "data": df_inter},
            {"name": "df_summary_test", "data": df_summary_test},
            {"name": "df_summary_provider", "data": df_summary_provider},
            {"name": "df_singles", "data": df_singles},
            {"name": "df_multi", "data": df_multi},
            {"name": "df_crosstab_results", "data": df_crosstab_results},
            {"name": "df_crosstab_results_multi", "data": df_crosstab_results_multi},
        ]
    )


if __name__ == "__main__":
    getData()
    exit(0)
