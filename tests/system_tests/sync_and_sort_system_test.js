// USES SHEET 2 FORM SYSTEM_TEST_SPREADSHEET_ID, FOUND IN 'SystemTestSuite.gs'

/**
 * @description - Tests the sync method, by alternatively syncing two seperate data sets.
 *                First, injects data, as the sheet is blank before a run.
 *                Second, syncs then attemps to sync a completely different data set, meaning the first data should be completely removed.
 *                Third, syncs then inserts the data from the first sync, learing to the removal of all the data from the first sync.
 *                After each sync, the sheet is sorted using the method "sortByHeaders", the test passes if and only if both the sync and the sort methods function correctly.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_sync_and_sort() {
  reset_sync_and_sort();

  var gsync_object = create_object_sync_and_sort();

  // inject the a's
  var input_data = prepare_data_sync_and_sort('A');
  gsync_object.inject(input_data);
  var result1 = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, 'Sheet2!A2').values[0][0];

  // syncing Bs
  var input_data_two = prepare_data_sync_and_sort('B');
  gsync_object.sync(input_data_two, true);
  gsync_object.sortByHeaders(true);  // Sorting by ascending order to ensure if any As remain, they are at the top
  var result2 = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, 'Sheet2!A2').values[0][0];

  // syncing As again
  gsync_object.sync(input_data, true);
  gsync_object.sortByHeaders(false);  // Sorting by desending order to ensure if any Bs remain, they are at the top
  var result3 = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, 'Sheet2!A2').values[0][0];
  
  return verify_sync_and_sort(result1, result2, result3);
}

/**
 * @description - Preapres a data set to be used by GSync (array of object literals)
 *                The data will represents two columns, a "Key" column of either 'A' or 'B' as values
 *                and "Value" column of the number 0 (for B) and 1 (for A)
 *
 * @return {array} - Array containing object literals representing a rows of data
 */
function prepare_data_sync_and_sort(a_or_b) {
  // creates 3000 lines of data
  var input_data = [], i ,dict_big, key;
  if (a_or_b === 'A') {
    for (i = 0; i < 500; i += 1) {
      key = a_or_b + i;
      dict_big = {Key: key, Value: 1};
      input_data.push(dict_big);
    }
  } else {
    for (i = 0; i < 500; i += 1) {
      key = a_or_b + i;
      dict_big = {Key: key, Value: 0};
      input_data.push(dict_big);
    }
  }
  return input_data;
}

/**
 * @description - Create a GSyncTable object to be used by test_sync_and_sort
 *
 * @return {object} - GSyncTable object
 */
function create_object_sync_and_sort() {
  
  var key_cols = ['Key'];
  var header_row = 3;
  var sheet = SpreadsheetApp.openById(SYSTEM_TEST_SPREADSHEET_ID).getSheetByName('Sheet2');
  var gsync_object = new GSyncTable(sheet,
                                    header_row,
                                    key_cols);
  return gsync_object;
}

/**
 * @description - Reads the value of a cell on the sheet, this cell contains a function that sums up the value of a column
 *                This value is calculated by summing column B from row 4 to 503 (500 entries of data)
 *                The value is the nused to verify whether a sync and a subsequent sort were successfully executed or not.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_sync_and_sort(result1, result2, result3) {
  if (result1 != 500) {
    console.error('test_sync_and_sort: data injection unsuccessful');
    return 'Fail';
  } else if (result2 != 0) {
    console.error('test_sync_and_sort: data sync or data sort unsuccessful');
    return 'Fail';
  } else if (result3 != 500) {
    console.error('test_sync_and_sort: data sync or data sort unsuccessful');
    return 'Fail';
  } else {
    return 'Success';
  }
}

/**
 * @description - Delets all data on the sheet, inserts two cells containing the values "SUM",
 *                and a formula to sum a whole column (column B on the sheet)
 */
function reset_sync_and_sort() {
  var range = 'Sheet2!A:Z';
  Sheets.Spreadsheets.Values.clear({}, SYSTEM_TEST_SPREADSHEET_ID, range);
  var resource = {
    "valueInputOption": "USER_ENTERED",
    "data": {
      "range": "Sheet2!A1:A3",
      "majorDimension": "COLUMNS",
      "values": [
        ["Sum", "=SUM(B4:B1003)", "Key"]
      ],
    }
  };
  Sheets.Spreadsheets.Values.batchUpdate(resource, SYSTEM_TEST_SPREADSHEET_ID)
}
