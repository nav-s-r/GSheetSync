// USES SHEET 2 FROM GSYNC UNIT TEST SPREADSHEET FOUND AT THE TOP OF 'UnitTestSuite.gs'

/**
 * @description - Calls the addUpdateRequest method to create the internal batch update object
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_addUpdateRequest() {
  var array = prepare_addUpdateRequest();
  var update_object = run_addUpdateRequest(array);
  var result = verify_addUpdateRequest(update_object);
  return result;
}

/**
 * @description - Creates array of arrays to be used to make calls for the addUpdateRequest method.
 *                First element in each array is the cell value to write, second is the header for that cell's column,
 *                third element is the row number for that cell.
 *
 * @return {array} - An array contianing arrays of function parameters
 */
function prepare_addUpdateRequest() {
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
  return batch_array;
}

/**
 * @description - Creates a GSyncTable object and runs the addUpdateRequest method.
 *                This generates an internal object contianing batch data to be used when writing values to sheet
 *
 * @return {object} - A GSyncTable object
 */
function run_addUpdateRequest(array) {
  var key_cols = ['Student Name', 'Home State'];
  var header_row = 1;
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet2');
  var object = new GSyncTable(sheet,
                              header_row,
                              key_cols);
  for (var ix in array) {
    var inp = array[ix];
    object.addUpdateRequest(inp[0], inp[1], inp[2]);
  }
  return object;
}

/**
 * @description - Reads values form the innteral batchData object.
 *                This data object contains information about the values and ranges to be updated on the sheet.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_addUpdateRequest(object_update) {
  var data = object_update.batchData;
  if ((data[2]['values'] != 'William') || (data[2]['range'] != 'Sheet2!A32')) {
    console.log('Error! addUpdateRequests has not been able to create the required batchData object');
    return 'Fail';
  } else {
    return 'Success';
  }
}
