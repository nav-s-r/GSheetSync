// USES SHEET 1 FROM GSYNC UNIT TEST SPREADSHEET FOUND AT THE TOP OF 'UnitTestSuite.gs'

/**
 * @desription - Executes the setHeaders method on a headers row and verifies the output
 *               Then executes it again on an empty row, again verifying all the resulting objects
 *
 * @return  {string} - The result of the test, 'Success' or 'Fail'
 */
function test_setHeaders() {
  var headers_array = prepare_setHeaders();
  var test_object = run_setHeaders(headers_array, 1);
  var full_headers_result = verify_setHeaders(test_object);
  
  // Now run the same test on an empty row
  var new_object = run_setHeaders(headers_array, 2);
  var empty_headers_result = verify_setHeaders(new_object);
  if (full_headers_result == 'Success' && empty_headers_result == 'Success') {
    return 'Success';
  } else {
    return 'Fail';
  }
}

/**
 * Instatiates a GSyncTable object to test upon, also creates an array of strings to represent possible headers, which are to be passed as an argument run_setHeaders
 *
 * @return {array}  - returns a GSyncTable object and an array containing some headers for part of another test
 */
function prepare_setHeaders() {
  var header_array = ['random', 'another', 'next header', 'consecutive header', 'weeknd', 'java', 'java', 'python', 'header2348', 'leen', 'purple'];
  return header_array;
}

/**
 * Takes an array containing an instantiated GSyncTable object, and an array of test headers. Calls the setHeaders method for the test object, and passes in the array of headers as well.
 *
 * @param  {array}  headers_array - Object containing strings which will be used as header values to be synced to sheet
 * @param  {number} number        - The position of the headers row on the sheet, will be set to 1 for the first test, then 2 (empty row) for the second test
 * @return {object}               - GSyncTable object
 */
function run_setHeaders(headers_array, number) {
  var key_cols = ['f0_', 'issue_id'];  // don't really need this for setting headers
  var header_row = number;  // correct headers row is 1, row 2 is a blank row used to test how the function handles blank rows (perhaps make that a seperate test)
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet10');
  
  var test = new GSyncTable(sheet,
                            header_row,
                            key_cols);
  test.setHeaders(headers_array);
  return test;
}

/**
 * Takes a GSyncTable object, and tests to see if it has the correct indexing for headers
 * Also verifies if newly added headers appear in the appropriate order
 *
 * @param  {object} GSyncTable_object - GSyncTable object instantiated in this file for testing purposes
 * @return {string}                    - The result of this test, 'Success' or 'Fail'
 */
function verify_setHeaders(GSyncTable_object) {
  if (GSyncTable_object.headersRowNum == 1) {
    var index_result = GSyncTable_object.headersToCol['z'];
    var additional_header_index = GSyncTable_object.indexToAlphabet[27];
    var additional_header_result = GSyncTable_object.headersToCol['random'];
    if (index_result == "Z") {
      console.log('Headers taken from the sheet are in correct working order');
      if (additional_header_result == additional_header_index) {
        console.log('Headers input by user are also indexed properly and in order');
        if (GSyncTable_object.headersToIndex['random'] == '27') {
          console.info('setHeaders initial test is a Success!');
          return 'Success';
        } else {
          console.error('The setHeaders function has not been able to map headers to their column numbers accurately.');
          return 'Fail'
        }
      } else{
        console.error('Additional headers were passed in to be added to a dictionry indexing headers by their columns in A1 notation.\n' +
                      '%s and %s should have been the same column index\n' +
                      'This shows that the additional headers that were passed in, have not been indexed in the order they were passed in.',
                      additional_header_result, additional_header_index);
        return 'Fail'
      }
      
    } else {
      console.log('Headers from the sheet\'s headers row, have not been interpreted in the correct order.\n' +
                  'header "z" should have been indexed as "Z" but is instead indexed as %s', GSyncTable_object.headersToCol['z']);
      console.info('FAIL!\nCheck log for details');
      return 'Fail'
    }
  } else {
    var result1 = GSyncTable_object.headersToCol['java'];
    var result2 = GSyncTable_object.indexToHeaders['4'];
    var result3 = GSyncTable_object.headersToIndex['weeknd'];
    if (result1 != 'F') {
      console.error('The setHeaders function has not been able to map headers to their column alphabets accurately');
      return 'Fail';
    } else if (result2 != 'weeknd') {
      console.error('The setHeaders function has not been able to map column indexes to their headers accurately');
      return 'Fail';
    } else if (result3 != 4) {
      console.error('The setHeaders function has not been able to map column headers with their column indexes successfully');
    } else {
      console.info('setHeaders final test is a Success!');
      return 'Success';
    }
  }
}
