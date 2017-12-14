// USES SHEET 6 FROM GSYNC UNIT TEST SPREADSHEET, FOUND IN 'SystemTestSuite.gs'

/**
 * @description - Tests the convertBigQueryResults method in GSync. uses that to then sync data to a sheet
 *                Reads the values synced to the sheet to verify if data was queried as expected
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_convertBigQueryResults() {
  reset_convertBigQueryResults();

  var query_results = prepare_convertBigQueryResults();
  var object = run_convertBigQueryResults(query_results);
  var result = verify_convertBigQueryResults();
  Logger.log(result);
  return result;
}

function prepare_convertBigQueryResults() {
  
  var project_id = 'project-id-4898670938912895674';
  var request = {
    query: ('SELECT id, title AS WIKI_Article ' +
            "FROM `bigquery-public-data.samples.wikipedia` "+
            'WHERE id IS NOT NULL ' +
            'GROUP BY id, WIKI_Article ' +
            'LIMIT 50'),
    useLegacySql: false
  };
  var queryResults = BigQuery.Jobs.query(request, project_id);
  var something = queryResults.rows[3].f[1];
  return queryResults;
}

/**
 * @description - Creates a GSyncTable object and executes some methods to:
 *                  Get an array of data converted into GSync valid data from the BirQuery query_results
 *                  Sync this converted data into the sheet
 *                  Sorts that sheet by headers (to avoid having blank lines in the middle
 *
 * @param  {object} - A BigQuery queryResults object, containing queried data
 * @return {object} - GSyncTable object
 */
function run_convertBigQueryResults(query_results) {
  var key_cols = ['id'];
  var header_row = 1;
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet6');
  var object_big = new GSyncTable(sheet,
                                  header_row,
                                  key_cols);
  var converted_data = object_big.convertBigQueryResults(query_results);
  object_big.sync(converted_data, false);
  object_big.sortByHeaders(true);
  return object_big;
}

/**
 * @description - Reads and validates cell values from the sheet to ensure the desired result
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_convertBigQueryResults() {
  var result1 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet6!A:A").values.length;
  var result2 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet6!B1").values[0][0];
  if (result1 == 51 && result2 == "WIKI_Article") {
    return 'Success';
  } else {
    console.error("test_convertBigQueryResults: Unable to accurately sync queried data into sheet");
    return 'Fail';
  }
}

/**
 * @description - Resets the sheet to its pre-test state, so this test can be repeated
 */
function reset_convertBigQueryResults() {
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, "Sheet6!A:Z");
}
