// USES SHEETS 1 AND 9 FROM GSYNC UNIT TEST SPREADSHEET FOUND AT THE TOP OF 'UnitTestSuite.gs'

/**
 * @desription - Creates an internal data store and then executes the updateInternalDataStore method
 *               Validates the output
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_updateInternalDataStore() {
  var data_array = prepare_updateInternalDataStore();
  var test_object = run_updateInternalDataStore(data_array, true);
  var result1 = verify_updateInternalDataStore(test_object);

  // Running the test on a blank sheet
  test_object = run_updateInternalDataStore(data_array, false);
  var result2 = verify_updateInternalDataStore(test_object);

  if (result1 == 'Success' && result2 == 'Success') {
    return 'Success';
  } else {
  return 'Fail';
  }
};

/**
 * @description - Prepares a data array containing object literals
 *
 * @return {array} - An array of object literals, representing rows of data, where cell values are mapped to column headers
 */
function prepare_updateInternalDataStore() {
  var main_array = [];
  var row1_data = {"Student Name": "Chamberlain", "Gender": "Male", "Major": "Football", "Home State": "England", "Class Level": "Mediocre"};
  main_array.push(row1_data);
  var row2_data = {"Student Name": "Hazard", "Gender": "Male", "Major": "Football", "Home State": "Belgium", "Class Level": "World Class"};
  main_array.push(row2_data);
  // rows 1 and 2 are new data not in the sheet

  // row 3 has a changed gender and class level
  var row3_data = {"Student Name": "Alexandra", "Gender": "Male", "Class Level": "5. Super Senior", "Major": "English", "Home State": "CA"};
  main_array.push(row3_data);
  // row 4 is unchanged data, it should be the same as row 4 on the sheet
  var row4_data = {"Student Name": "Anna", "Gender": "Female", "Class Level": "1. Freshman", "Home State": "NC", "Major": "English"};
  main_array.push(row4_data);
  return main_array;
}

/**
 * @description - Instantiates an instance of a GSyncTable object, and then runs the updateInternalDataStore method on it
 *
 * return {object} - GSyncTable object
 */
function run_updateInternalDataStore(main_array, bool) {
  if (bool) {
    var key_cols = ['Student Name', 'Home State'];
    var header_row = 1;
    var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet1');
    var test_object = new GSyncTable(sheet,
                                     header_row,
                                     key_cols);
    test_object.createInternalDataStore(main_array);
    test_object.updateInternalDataStore();
    return test_object;
  } else {
    var key_cols = ['Student Name', 'Home State'];
    var header_row = 1;
    var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet9');
    var test_object = new GSyncTable(sheet,
                                     header_row,
                                     key_cols);
    test_object.createInternalDataStore(main_array);
    test_object.updateInternalDataStore();
    return test_object;
  }
}

/**
 * @description - Reads specific cells from the sheet and verifies their values
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_updateInternalDataStore(test_object) {
  if (test_object.lastRowNum !== 2) {
    var key = ["Hazard", "Belgium"];
    // see if this test_object has an empty sheetRow test_object inside
    if (test_object.internalDataStore[key]["sheetRow"] != '') {
      return 'Fail';
    };
    key = ["Anna", "NC"];
    var row_result = test_object.internalDataStore[key]["rowNumber"];
    if (row_result != 4) {
      console.error('Error! Row numbers have not been set correctly by the updateInternalDataStore function');
      return 'Fail';
    }
    key = ["Alexandra", "CA"];
    var result1 = test_object.internalDataStore[key]["sheetRow"]["Gender"];
    var result2 = test_object.internalDataStore[key]["rawRow"]["Gender"];
    // sheetRow gender should be 'Female', and rawRow gender should be 'Male' (changed in the prepare_update function above)
    // row_result should be 4, Anna is on the 4th row on the sheet
    if (result1 == result2){
      console.error('Error! sheet rows and raw rows have been interpretted incorrectly by GSync');
      return 'Fail';
    };
    key = ["Benjamin", "WI"];
    var raw_value = test_object.internalDataStore[key]["rawRow"];
    if (raw_value != '') {
      console.error('Error! False information has been entered by GSync\'s update_internal_store function');
      return 'Fail';
    };
    return 'Success';
  } else {
    // we simply need to ensure the function didn't run
    for (key in test_object.internalDataStore) {
      if ((test_object.internalDataStore[key]['sheetRow'] != '') || (test_object.internalDataStore[key]['rowNumber'] != '')) {
        console.error('Testing the updateInternalDataStore function with a blank sheet has resulted in incorrect information being entered in the internal data structure used by GSync');
        return 'Fail';
      };
    };
    return 'Success';
  }
}
