// USES SHEET 5 FROM SYSTEM_TEST_SPREADSHEET_ID (FOUND IN 'SystemTestSuite.gs')

/**
 * @description - Tests whether GSync is able to successfully undelete the rows that it previously flagged for deletion.
 *                First syncs an empty array to mark all rows as deleted, then syncs full sheet data and validates the results.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_delete_and_undelete() {
  reset_delete_and_undelete()
  
  var output = prepare_delete_and_undelete();
  var input_data = output[1];
  var object = output[0];
  
  // Syncing empty data to flag all rows as " (DELETED)"
  run_delete_and_undelete(object, []);
  var result1 = verify_delete_and_undelete(0);
  
  // Sync data contianing all the keys from the original, to remove the deleted tags from the rows
  run_delete_and_undelete(object, input_data);
  var result2 = verify_delete_and_undelete(1);
  
  if (result1 == 'Success' && result2 == 'Success') {
    return 'Success';
  } else {
    return 'Fail';
  }
}

/**
 * @description - Creates an array of object literals containing a primary key from every row on the sheet mapped to the key column header
 *                Creates a GSyncTable object
 *
 * @return {object, array} - A GSyncTable object and an array contianing object literals representing rows of data in one column
 */
function prepare_delete_and_undelete() {
  var names = [
    "Alexandra", "Andrew", "Anna", "Becky", "Benjamin", "Carl", "Carrie", "Dorothy", "Dylan", "Edward",
    "Ellen","Fiona", "John", "Jonathan", "Joseph", "Josephine", "Karen", "Kevin", "Lisa", "Mary", "Maureen",
    "Nick", "Olivia","Pamela", "Patrick", "Robert", "Sean", "Stacy", "Thomas", "Will"
  ];
  var names_array = [];
  for (var i = 0; i < names.length; i += 1) {
    var temp_object = {"Student Name": names[i]};
    names_array.push(temp_object);
  }
  var key_cols = ['Student Name'];
  var header_row = 1;
  var sheet = SpreadsheetApp.openById(SYSTEM_TEST_SPREADSHEET_ID).getSheetByName('Sheet5');
  var object = new GSyncTable(sheet,
                              header_row,
                              key_cols);
  return [object, names_array];
}

/**
 * @description - Runs the sync method on the "object" using the input "array"
 */
function run_delete_and_undelete(object, array) {
  object.sync(array, false);
}

/**
 * @description - Reads and validates all cells in the primary key column.
 *                On first call (from test_query_and_formulae) checks if all rows have been marked as deleted.
 *                On second call, verifies that all primary keys are no longer marked with a deleted tag.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_delete_and_undelete(num) {
  if (num === 0) {
    for (var ix=2; ix<32; ix+=1) {
      var value = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, "Sheet5!A" + ix).values[0][0];
      if (value.indexOf(" (DELETED)") == -1) {
        console.error('Fail! Unable to delete unsynced rows of data');
        return 'Fail';
      }
    }
    return 'Success';
  } else if (num === 1) {
    for (var ix=2; ix<32; ix+=1) {
      var value = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, "Sheet5!A" + ix).values[0][0];
      if (value.indexOf(" (DELETED)") != -1) {
        console.error('Fail! Unable to undelete all synced rows of data');
        return 'Fail';
      }
    }
    return 'Success';
  }
}

/**
 * @description - Removes all data from the sheet, leaving only the headers row.
 *                Also inserts values into some cells, inserts formulae which are used to later verify this test.
 */
function reset_delete_and_undelete() {
  var data = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, 'Sheet1!A1:G31').values;
  var range = 'Sheet5!A:Z';
  Sheets.Spreadsheets.Values.clear({}, SYSTEM_TEST_SPREADSHEET_ID, range);
  var resource = {
    values: data
  };
  var range = 'Sheet5!A:Z';
  Sheets.Spreadsheets.Values.update(resource, SYSTEM_TEST_SPREADSHEET_ID, range, {"valueInputOption": "USER_ENTERED"});
}
