# %% imports
import glob

import inspect
import pickle

from typing import List
from tqdm import tqdm
from report_config import *

# %% methods
def get_var_name(var):
    local_vars = inspect.currentframe().f_back.f_locals.items()
    return [var_name for var_name, var_val in local_vars if var_val is var]

def save_dataframes(dataframes: List):
    df_progress = tqdm(dataframes)
    for df in df_progress:
        df_name = df['name']
        df_progress.set_description('Saving: %s' % df_name)
        with open(DATA_DIR+DF_PREFIX+df_name+DF_EXT, 'wb') as out_file:
            pickle.dump(df, out_file)

def get_dataframes(data_dir=DATA_DIR, prefix=DF_PREFIX, postfix = DF_EXT):
    dataframes_names = glob.glob(data_dir+prefix+'*'+postfix)
    df_progress = tqdm(dataframes_names)
    dataframes = {}
    for df in df_progress:
        with open(df, 'rb') as in_file:
            d = pickle.load(in_file)
            dataframes[d['name']] = d['data']
    return dataframes

def get_html_base():
    base = '''
    <!DOCTYPE html>
    <html>
        <head>
            {%metas%}
            <title>{%title%}</title>
            {%favicon%}
            <style>
                html {
                    height: 100%;
                    max-width: 100%;
                }
                body {
                    min-height: 100%;
                    max-width: 100%;
                }

                .card {
                    padding: 0;
                    width: 20rem;
                    margin-right: 8px;
                    margin-bottom: 8px;
                }
                .card-text {
                    color: #999999;
                    margin-bottom: 5.5px;
                    font-size: 14px;
                    display: block;
                }

                .card-title {
                    font-weight: bold;
                    font-size: 30px;
                    margin-top: 0;
                    margin-bottom: 0px;
                }

                .cell-markdown {
                    padding: 4px;
                }
                .cell-markdown p  {
                    margin-bottom: 0; 
                }

                .dash-table-container .dash-spreadsheet-container .dash-spreadsheet-inner input:not([type=radio]):not([type=checkbox]){
                    color: #f3f3f3!important;
                }
            </style>
            {%css%}
        </head>
        <body>
            {%app_entry%}
            <footer>
                {%config%}
                {%scripts%}
                {%renderer%}
                <div>W3C Traceability Interop Profile Test Results</div>
            </footer>
        </body>
    </html>
    '''
    return base

# %%
