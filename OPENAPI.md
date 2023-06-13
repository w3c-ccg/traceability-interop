# OpenAPI Specification

## Importing the OpenAPI Specification Into Postman

If you are using Postman, you can import all of the available API endpoints 
into an easy to use collection by following the instructions below:

1. While inside a Postman Workspace, you should see an **`import`** button at 
   the top of your list of collections. Click this to begin the importing process.
2. After clicking **`import`**, a dialog will open providing you with a couple 
   of options for importing the collection. The easiest is to import using a 
   **`Link`**. To do this, simply paste the following URL into the input box, 
   and click **`Import`**: 
   `https://w3c-ccg.github.io/traceability-interop/openapi/openapi.json`. 
   Alternatively, you can use the **`Raw text`** option by copying the JSON 
   found at 
   `https://w3c-ccg.github.io/traceability-interop/openapi/openapi.json`, and 
   pasting it into the input box.

You should see something like this in your collections once you have 
successfully imported the spec:

<p align="center">
  <a href="./docs/imported-collection.png">
    <img src="./docs/imported-collection.png" width="25%" height="25%" align="center">
  </a>
</p>


## Included scripts for managing OpenAPI Specification

1. `npm run validate-spec`: This command can be used to validate the 
   `openapi.yml` spec, ensuring there are no issues.
2. `npm run preserve`: This command is used to bundle our `openapi.yml` file 
   into an `openapi.json` file that can be used to import the collection/spec.

For additional documentation on how the `swagger-cli` can be used, visit 
[here](https://www.npmjs.com/package/swagger-cli).
