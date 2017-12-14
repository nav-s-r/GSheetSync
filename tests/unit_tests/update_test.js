// USES SHEET 4 FROM GSYNC UNIT TEST SPREADSHEET (FOUND IN 'UnitTestSuite.gs')

/**
 * @description - Executes the update method and verifies results from reading the sheet updated by GSync
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_update() {
  reset_update();
  var data = prepare_update();
  
  // Run function, flagging rows that should be deleted
  var object = run_update(data, false);
  var result1 = verify_update();
  
  // Run function, removing rows that should be deleted
  run_update(data, true);
  var result2 = verify_update(object);
  
  if (result1 == 'Success' && result2 == 'Success') {
    return 'Success';
  } else {
    return 'Fail';
  }
}

/**
 * @description - Prepares a data set contianing which will be used as the GSync input data.
 *                Each object represents a row of data.
 *                This data will be synced onto the sheet.
 *
 * @return {array} - An array contianing object literals
 */
function prepare_update() {
  var data = [
    {'Student Name': 'Alexandra', 'Gender': 'Female', 'Class Level': 'Changed value for test', 'Home State': 'another change', 'Some Numbers': '11111111111111'},
    {'Student Name': 'Becky', 'Major': 'English', 'Home State': 'SD'},
    {'Student Name': 'Andrew', 'Gender': 'some alien ting', 'Major': 'English too blud!'},
    {'Student Name': 'Carl', 'Major': 'Major Major'},
    {'Student Name': 'Carrie', 'Major': 'Minor', 'Extracurricular Activity': 'Fifa'},
    {'Student Name': 'Ellen', 'Major': 'Artisan'},
    {'Student Name': 'Will', 'New Column': 'First new field brought to you by GSync'},
    {'Student Name': 'Thomas', 'New Column': 'New Value'},
    {'Student Name': 'Stacy', 'New Column': 'Stay See'},
    {'Student Name': 'Nick', 'Major': 'Super Major', 'Home State': 'Compton What Up!'},
    {'Student Name': 'Sanchez', 'Major': 'Football', 'Class Level': 'World', 'Verdict': "Deserves Ballon D'Or Nomination!"},
    {'Student Name': 'Anna'},
    {'Student Name': 'Carl'}
  ];
  
  return data;
}

/**
 * @description - Creates a GSyncTable object and executes its update method.
 *
 * @param  {array}   - An array of object literals created in prepare_update()
 * @param  {boolean} - True or False, will decide whether rows are flagged or removed
 * @return {object}  - A GSyncTable object
 */
function run_update(data, bool) {
  var key_cols = ['Student Name'];
  var header_row = 1;
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet4');
  var object_main = new GSyncTable(sheet,
                                   header_row,
                                   key_cols);
  object_main.update(data, true, bool);
  object_main.sortByHeaders(true, ["Student Name"]);
  return object_main;
}

/**
 * @description - Makes appropriate calls to functions that then verify the results of this test
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_update(object) {
  if (!object) {
    var result = verify_flagged_sheet();
  } else {
    var result = verify_removed_sheet(object);
  }
  return result;
}

/**
 * @description - Reads and verifies cell values for when the update method flags rows for deletion
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_flagged_sheet() {
  var value1 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet4!A29').values[0][0];
  var value2 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet4!A28').values[0][0];
  var value3 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet4!G2').values[0][0];
  if ((value1 == 'Sean (DELETED)') && (value2 == 'Sanchez') && (value3 == '$11,111,111,111,111.00')) {
    console.log('update: test 1 is a Success!');
    return 'Success';
  } else {
    console.log('the update function was unable to add delete flags and new values');
    return 'Fail';
  }
}

/**
 * @description - Reads and verifies cell values for when the update method removes rows
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_removed_sheet(object_main) {
  var input_array = [
    'Alexandra', 'Becky', 'Andrew', 'Carl', 'Carrie', 'Ellen', 'Will', 'Thomas',
    'Stacy', 'Nick', 'Sanchez', 'Anna'
  ];
  
  var value1 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet4!A10').values;
  
  var value2 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet4!H11').values[0];
  var array1 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet4!A2:A').values[0];
  var accurate_rows_removed = false;
  for (var ix in array1) {
    if (object_main.checkArrayInArray(input_array, array1[ix])) {
      correct_rows_removed = true;
    } else {
      correct_rows_removed = false;
      break;
    }
  }
  if ((correct_rows_removed) && (value1 == 'Sanchez') && (value2 == 'Stay See')) {
    console.log('update: test 2 is a Success!');
    return 'Success';
  } else {
    console.log('the update function has been unable to accurately remove rows marked for deletion');
    return 'Fail';
  }
}

/**
 * @description - Resets the sheet to its pre-test state, so this test can be repeated
 */
function reset_update() {
  var cell_values = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet1!A1:I31').values;
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, "Sheet4!A:Z");
  var resource = {
    values: cell_values
  };
  Sheets.Spreadsheets.Values.update(resource, UNIT_TEST_SPREADSHEET_ID, "Sheet4!A1:I31", {"valueInputOption": "USER_ENTERED"});
}
