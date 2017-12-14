// USES SHEET 8 FROM GSYNC UNIT TEST SPREADSHEET (FOUND IN 'UnitTestSuite.gs')

/**
 * @description - Executes functions to properly test the setFormulae method
 *                Verfies all the appropriate functionality of the setFormulae method
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_setFormulae() {
  reset_setFormulae();
  var data = prepare_setFormulae();
  var object = run_setFormulae(data);
  var result = verify_setFormulae();
  reset_setFormulae();
  return result;
}

/**
 * @description - Creates a data set that will be used as the raw data input for GSync
 *
 * @return {array} - An array containing object literals
 */
function prepare_setFormulae() {
  var data_main = [
    {'Student Name': 'Alexandra', 'Gender': 'Female', 'Class Level': 'Changed value for test', 'Home State': 'another change', 'Some Numbers': '11111111111111'},
    {'Student Name': 'Becky', 'Major': 'English', 'Home State': 'SD'},
    {'Student Name': 'Andrew', 'Gender': 'some alien ting', 'Major': 'English too blud!'},
    {'Student Name': 'Carl', 'Major': 'Major Major', "Some Numbers": "569689"},
    {'Student Name': 'Carrie', 'Major': 'Minor', 'Extracurricular Activity': 'Fifa'},
    {'Student Name': 'Ellen', 'Major': 'Artisan'},
    {'Student Name': 'Will', "Some Numbers": "487586576"},
    {'Student Name': 'Thomas'},
    {'Student Name': 'Stacy', "num": "don't fill me"},
    {'Student Name': 'Nick', 'Major': 'Super Major', 'Home State': 'Compton What Up!', "formulaRow": "don't fill me", "num": "don't fill me", "Some Numbers": 566555},
    {'Student Name': 'Sanchez', 'Major': 'Football', 'Class Level': 'World', 'Verdict': "Deserves Ballon D'Or Nomination!", "num": "don't fill me", "Some Numbers": 456, "Another_formulaRow": "don't fill me either!"},
    {'Student Name': 'Anna', "num": "don't fill me", "Another_formulaRow": "don't fill me either!"}
  ];
  return data_main;
}

/**
 * @description - Creates a GsyncTable object and executes the sync method using the "data" input
 *                The sync method calls the update method which runs the setFormulae method as the data is synced
 *
 * @param  {array}  - The array of data created in prepare_setFormulae
 * @return {object} - GSyncTable object
 */
function run_setFormulae(data) {
  var key_cols = ['Student Name'];
  var header_row = 2;
  var optional = {formulaRow: 9};
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet8');
  var object_main = new GSyncTable(sheet,
                                   header_row,
                                   key_cols,
                                   optional);
  object_main.sync(data);
  return object_main;
}

/**
 * @description - Reads and validates cell values on the sheet to verify that formulae were copied and set,
 *                for all the newly injected rows of data
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_setFormulae() {
  var value1 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet8!I10').values[0][0];
  if (value1 !== 'Alexandra') {
    console.error('test_adding_formulae: failed attempting to inspect the first value');
    return 'Fail';
  }
  var value2 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet8!I9", {valueRenderOption: "FORMULA"}).values[0][0];
  if (value2 != "=A9") {
    console.error('test_adding_formulae: A Value has been overwritten, GSync has been unable to determine strating row for entering new data');
    return 'Fail'
  }
  var value3 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet8!H18").values[0][0];
  if (value3 != "don't fill me") {
    console.error("test_adding_formulae: GSync has been unable to maintain newly added data, " +
                  "a formula has overwritten a cell which was supposed to be reserved, as there was data input for this cell");
    return 'Fail';
  }
  var value4 = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet8!H7").values;
  if (value4 != undefined) {
    console.error('test_adding_formulae: GSync has overwritten a cell which hsould have been blank, GSync is meant to ignore current row data when applying formulae into a column');
    return 'Fail';
  }
  return 'Success';
}

/**
 * @description - Resets the sheet to its pre-test state, deleting , so this test can be repeated
 */
function reset_setFormulae() {
  var data = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, 'Sheet2!A1:G7').values;
  var range = 'Sheet8!A3:L8';
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, range);
  range = 'Sheet8!A10:Z';
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, range);
  range = "Sheet8!J2:Z";
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, range);

  var resource = {
    values: data
  };
  var range = 'Sheet8!A2:G8';
  Sheets.Spreadsheets.Values.update(resource, UNIT_TEST_SPREADSHEET_ID, range, {"valueInputOption": "USER_ENTERED"});
}
