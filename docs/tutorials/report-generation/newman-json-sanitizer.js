/*

jsonReport.run.executions will contain:

- 🔥 OAuth ACCESS_TOKENs 🔥
- 🔥 OAuth CLIENT_ID 🔥
- 🔥 OAuth CLIENT_SECRET 🔥

*/

// 🔥 this is the most dangerous function
const cleanExecutions = (executions) => {
  const safeExecutions = [];
  executions.forEach((execution) => {
    safeExecutions.push({
      id: execution.id,
      cursor: execution.cursor,
      item: {
        id: execution.item.id,
        name: execution.item.name,
      },
      // 🔥 we opt to not include any details of the request, and only status and timing from the response
      // request details can be inferred from collection data.
      // NOTE: The `response` may be missing if there was a request error, e.g.,
      //       ENOTFOUND in the case of missing base url parameters.
      response: {
        id: execution.response?.id,
        status: execution.response?.status,
        code: execution.response?.code,
        responseTime: execution.response?.responseTime,
        responseSize: execution.response?.responseSize,
      },
      assertions: execution.assertions,
    });
  });
  return safeExecutions;
};

module.exports = (jsonReport) => {
  const safeToPublishReport = {
    collection: {
      info: jsonReport.collection.info,
      item: jsonReport.collection.item,
    },
    run: {
      stats: jsonReport.run.stats,
      timings: jsonReport.run.timings,
      executions: cleanExecutions(jsonReport.run.executions),
    },
  };
  return safeToPublishReport;
};
