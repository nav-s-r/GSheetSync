// USES SHEET 2 FROM GSYNC UNIT TEST SPREADSHEET FOUND AT THE TOP OF 'UnitTestSuite.gs'

/**
 * @description - Calls addUpdateRequests method to create an internal data set containing all the data required for cell writing.
 *                Executes the writeRequests method and verifies the result directly from the sheet which is updated by GSync.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_writeRequests() {
  reset_writeRequests();

  var object = prepare_writeRequests();
  run_writeRequests(object);
  var result = verify_writeRequests();
  
  reset_writeRequests();
  return result;
}

/**
 * @description - Creates a GSyncTable object and an array of parameters.
 *                Calls the addUpdateRequests method using this array to create a "batchData" object.
 *                This object contains the information used to write cell values
 *
 * @return {object} - GSyncTable Object
 */
function prepare_writeRequests() {
  var batch_array = [['Wii', 'Student Name', 31],
                     ['Shaun', 'Student Name', 28],
                     ['William', 'Student Name', 32],
                     ['Hill', 'Gender', 32],
                     ['1. Sophomore', 'Class Level', 32],
                     ['FL', 'Home State', 32],
                     ['NYC', 'Home State', 29],
                     ['Football', 'Major', 32],
                     ['Sanchez', 'Student Name', 35]
                    ];

  var key_cols = ['Student Name', 'Home State'];
  var header_row = 1;
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet2');
  var object = new GSyncTable(sheet,
                              header_row,
                              key_cols);

  for (var ix in batch_array) {
    var inp = batch_array[ix];
    object.addUpdateRequest(inp[0], inp[1], inp[2]);
  }
  return object;
}

/**
 * @description - Executes the writeRequests method on the GSyncTable object
 */
function run_writeRequests(writing_object) {
  writing_object.writeRequests();
}

/**
 * @description - Reads values from the sheet, and verifies them to ensure the updates have been carried out
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_writeRequests(written_object) {
  var value1 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet2!A31').values[0][0];
  var value2 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet2!A35').values[0][0];

  if ((value1 != 'Wii') || (value2 != 'Sanchez')) {
    console.log('Error! The write requests function was unable to update the test sheet');
    return 'Fail';
  } else {
    return 'Success';
  }
}

/**
 * @description - Resets the sheet to its pre-test state, so this test can be repeated
 */
function reset_writeRequests() {
  var cell_values = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet1!A1:I31').values;
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, "Sheet2!A:Z");
  var resource = {
    values: cell_values
  };
  Sheets.Spreadsheets.Values.update(resource, UNIT_TEST_SPREADSHEET_ID, "Sheet2!A1:I31", {"valueInputOption": "USER_ENTERED"});
}
