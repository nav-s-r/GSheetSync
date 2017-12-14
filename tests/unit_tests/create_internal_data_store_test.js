// USES SHEET 1 FROM GSYNC UNIT TEST SPREADSHEET FOUND AT THE TOP OF 'UnitTestSuite.gs'

/**
 * @description - Creates the internal data store used in GSync and validates the output
 *
 * @return {string} - The status of the test, 'Success' or 'Fail'
 */
function test_createInternalDataStore() {
  var test_array = prepare_createInternalDataStore();
  var test_object = run_createInternalDataStore(test_array);
  var result = verify_createInternalDataStore(test_object);
  reset_createInternalDataStore();
  return result;
};

/**
 * @description - Creates the raw data that will be used by GSync to create the internal data store
 *
 * @return {array} - Data array contianing object literals
 */
function prepare_createInternalDataStore() {
  var main_array = [];
  var row1_data = {"number 7": "Sanchez", "number 11": "Ozil", "issue_id": 1, 33: 'cech', "number 8": 'Ramsey', "number 9": "Lacazette", "star_player": "Sanchez"};
  main_array.push(row1_data);
  var row2_data = {"number 10": "Hazard", "number 7": "Pedro", "Bakayoko": "number 14", "number 9": "Morata", "issue_id": 2, "star_player": "Hazard", "CustomerName": 'Conte'};
  main_array.push(row2_data);
  var row3_data = {"number 7": "Ronaldo", "number 11": "Bale", "number 9": "Benzema", "issue_id": 3}
  main_array.push(row3_data);
  return main_array;
};

/**
 * @description - Creates a GSync object and calls the createInternalDataStore method
 *
 * @return {object} - GSyncTable object
 */
function run_createInternalDataStore(creation_array) {
  var key_cols = ['number 7', 'issue_id', "number 9"];
  var header_row = 1;
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet1');
  
  var test_object = new GSyncTable(sheet,
                                   header_row,
                                   key_cols);
  test_object.createInternalDataStore(creation_array);
  return test_object;
};

/**
 * @description - Calls 2 functions to verify the keys and values of the internal data store
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_createInternalDataStore(test_object) {
  var result1 = verify_internal_data_keys(test_object);
  var result2 = verify_internal_data_values(test_object);
  if ((result1 == 'Success') && (result2 == 'Success')) {
    return 'Success';
  } else {
    return 'Fail';
  }
}

/**
 * @description - Validates the keys with which the internal data store should be indexed
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_internal_data_keys(test_object) {
  var output_keys = Object.keys(test_object.internalDataStore);
  var input_primary_keys_array = [];
  input_primary_keys_array.push(['Sanchez', '1', 'Lacazette']);
  input_primary_keys_array.push(['Ronaldo', '3', 'Benzema']);
  input_primary_keys_array.push(['Pedro', '2', 'Morata']);
  var count = 0;
  for (var inx in input_primary_keys_array) {
    if (test_object.checkArrayInArray(output_keys, input_primary_keys_array[inx])) {
      count += 1;
    };
  };
  if (count == 3) {
    console.log('Input primary keys match the primary keys chosen by the createInternalDataStore function');
    return 'Success';
  } else {
    console.error('Fail! One or more of the primary keys from the input data, differ from the primary keys found by the createInternalDataStore function');
    return 'Fail';
  }
};

/**
 * @description - Checks the data stored for a specific key form the internal data store,
 *              verifies some values from the object that should be mapped to this key
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_internal_data_values(test_object) {
  var key1 = ['Pedro', '2', 'Morata'];
  var row1 = test_object.internalDataStore[key1]['rawRow'];
  // the value for 'number 7' should return 'Pedro', and the value for 'number 10' should return 'Hazard'
  if ((row1['number 7'] == 'Pedro') && (row1['number 10'] == 'Hazard') && (row1['issue_id'] == '2')) {
    return 'Success';
  } else {
    console.log('Fail! Row values have not been indexed under the correct headers');
    return 'Fail';
  }
};

/**
 * @description - Clears all cell values that were written in this test
 */
function reset_createInternalDataStore() {
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, "Sheet1!H1:1");
}
