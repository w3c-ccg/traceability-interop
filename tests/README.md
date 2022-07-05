# Traceability API Conformance Testing

The Postman suite in this directory is intended to test API implmentations for
conformance against the published OpenAPI spec.

Testing is performed by making requests to an endpoint and validating response
bodies against configured schemas. Schemas are maintained in the Postman collection
by the `update_conformance_schemas.sh` script, which is run by a workflow triggered
by changes to files in the `docs/openapi` folder.

## Testing Notes

### Optional Elements
When a schema calls for optional elements, the base happy path test will exclude all optional items. There will be one additional happy path test each optional item separately.

There will be one negative test for each optional item in which an invalid value will be used.

### Alternate Elements
When a schema calls for one of several possible values for an item, the base happy path test will include testing for the first alternate. Additional happy path tests will be created for each of the remaining alternates.

Negative tests will be created separately for each alternate item.

### Negative Type Checking
Negative testing for type checking is not exhaustive, e.g., if a schema element is defined to be an array of strings, we will only check that schema validation fails when the actual value is an array of integers. We will not iterate through all possible other data types to ensure that they all fail.

In the future, we may opt to create separate requests for each possible type to ensure that they all fail, or create tests where the value is randomized over a list of invalid values.

### Negative Value Checking
When a schema element is constrained to an enum of string values, negative testing will only check that the schema validation fails for a single bad value. In this case, exhaustive testing is not feasible.

