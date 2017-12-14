// USES SHEET 3 FROM GSYNC UNIT TEST SPREADSHEET (FOUND IN 'UnitTestSuite.gs')

/**
 * @description - Tests the method deleteRows on the sheet specified above, verifying that:
 *                  Rows can be flagged for deletion
 *                  Rows can be removed form the sheet
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_deleteRows() {
  reset_deleteRows();
  var deletion_array = prepare_deleteRows();
  var deletion_object = run_deleteRows(deletion_array);
  var result = verify_deleteRows(deletion_object)
  reset_deleteRows();
  return result;
};

/**
 * @description - Prepares data to be used to make calls for row deletion
 *
 * @return {array} - An array of arrays contianing input parameters to be used for the deleteRows method
 */
function prepare_deleteRows() {
  // create an array containing both inputs
  var deletion_array = [[2, ['Alexandra','CA']],
                        [3, ['Andrew', 'SD']]];
  return deletion_array;
}

/**
 * @description - Instantiates a GSyncTable object, and calls the deleteRows method using input parameters
 *
 * @param  {array}  - Array containing inputs for the deleteRows method
 * @return {object} - GSyncTable object
 */
function run_deleteRows(deletion_array) {
  var key_cols = ['Student Name', 'Home State'];
  var header_row = 1;
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet3');
  var deletion_test_object = new GSyncTable(sheet,
                                            header_row,
                                            key_cols);
  for (var ix=0; ix<deletion_array.length; ix+=1) {
    var info = deletion_array[ix];
    deletion_test_object.deleteRows(info[0], info[1]);
  }
  deletion_test_object.deleteRows(4);
  deletion_test_object.writeRequests();
  return deletion_test_object;
};

/**
 * @description - Reads data form the sheet and validates the cell values
 *
 * @param  {object} - A GSyncTable object
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_deleteRows(deletion_object) {
  var value1 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet3!A2").values[0][0];
  var value2 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet3!D2").values[0][0];
  var value3 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet3!A4");
  if (value1 != 'Alexandra (DELETED)' || value2 != 'CA (DELETED)' || value3.values == [['Anna']]) {
    return 'Fail';
  } else {
    return 'Success';
  }
}

/**
 * @description - Resets the sheet to its pre-test state, so this test can be repeated
 */
function reset_deleteRows() {
  cell_values = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet1!A1:I31').values;
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, "Sheet3!A:Z");
  var resource = {
    values: cell_values
  };
  Sheets.Spreadsheets.Values.update(resource, UNIT_TEST_SPREADSHEET_ID, "Sheet3!A1:I31", {"valueInputOption": "USER_ENTERED"});
}
