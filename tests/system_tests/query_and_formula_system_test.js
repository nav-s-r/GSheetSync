// USES SHEET 3 FROM SYSTEM_TEST_SPREADSHEET_ID (FOUND IN 'SystemTestSuite.gs')

/**
 * @description - Tests and validates how well "convertBigQueryResults" and "setFormulae" work with a large data set (3000 lines).
 *                  Converting the queried data into GSync valid input data, then syncing it to the sheet,
 *                  after which formulae must be added to each row.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_query_and_formulae() {
  reset_query_and_formulae();

  var query_results = prepare_query_and_formulae();
  run_query_and_formulae(query_results);
  return verify_query_and_formulae();
  
}

/**
 * @description - Creates and executes a BigQuery qeury to generate 3000 lines of data.
 *
 * @return {object} - JSON object literal contianing results from a BigQuery qeury
 */
function prepare_query_and_formulae() {
  var projectId = 'project-id-4898670938912895674';
  var request = {
    query: 'SELECT id, title FROM [bigquery-public-data:samples.wikipedia] WHERE id IS NOT NULL GROUP BY id, title ORDER BY id LIMIT 3000'
  };
  var queryResults = BigQuery.Jobs.query(request, projectId);
  return queryResults;
}

/**
 * @description - Creates a GSyncTable object and executes the convertBigQueryResults method to turn query results to GSync input data.
 *                Syncs that data into the sheet.
 */
function run_query_and_formulae(qeury_results) {
  var key_cols = ['id'];
  var header_row = 1;
  var option = {formulaRow: 2};
  var sheet = SpreadsheetApp.openById(SYSTEM_TEST_SPREADSHEET_ID).getSheetByName('Sheet3');
  var object_main = new GSyncTable(sheet,
                                   header_row,
                                   key_cols,
                                   option);
  var changed_results = object_main.convertBigQueryResults(qeury_results);
  object_main.sync(changed_results);
  /*
  var sheet = SpreadsheetApp.openById(object_main.spreadsheetId).getSheetByName("Sheet3");
  var datarange = sheet.getRange("3:" + sheet.getLastRow());
  datarange.sort([{column: 1, ascending: true}]);
  */
}

/**
 * @description - Reads cell values to validate this system test.
 *                  A formula is set to put a "1" value in each row where data has been input
 *                  There is another cell that sums up the column containing the formulae.
 *                Validates that this cell value is indeed 3000.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_query_and_formulae() {
  var value = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, "Sheet3!D2").values[0][0];
  if (value != 3000) {
    console.error("test_query_and_formulae: Either bigquery didn\'t put out 3000 rows of data, or the formula wasn't written on the 3000 cells.")
  } else {
    return 'Success';
  }
}

/**
 * @description - Restores the sheet to a blank state, leaving just the headers row and the formulae intact.
 */
function reset_query_and_formulae() {
  var range = 'Sheet3!A3:Z';
  Sheets.Spreadsheets.Values.clear({}, SYSTEM_TEST_SPREADSHEET_ID, range);
  var resource = {
    "valueInputOption": "USER_ENTERED",
    "data": {
      "range": "Sheet3!C1:D2",
      "majorDimension": "COLUMNS",
      "values": [
        ["Func", "=IF(A2, 1, 0)"],
        ["", "=SUM(C3:C)"]
      ],
    }
  };
  Sheets.Spreadsheets.Values.batchUpdate(resource, SYSTEM_TEST_SPREADSHEET_ID)
}
