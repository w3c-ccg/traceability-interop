Be careful generating reports from postman.

Ensure that no senstive data is included in the report.

```
npm install -g newman newman-reporter-html
```

```sh
newman run ./report-tester.collection.json \
--reporters cli,html,json
```
