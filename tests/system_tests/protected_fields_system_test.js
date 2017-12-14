// USES SHEET 4 FROM SYSTEM_TEST_SPREADSHEET_ID (FOUND IN 'SystemTestSuite.gs')

/**
 * @description - Tests if GSync is able to successfully protect certain fields from having data updated or not
 *                Also verifies that blanked cells in a protected range can be written to or not
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_protected_fields() {
  reset_protected_fields();
  
  var data = prepare_protected_fields();
  run_protected_fields(data);
  
  return verify_protected_fields();
}

/**
 * @description - Creates a data set valid for GSync, that contains all the primary keys for the current sheet
 *                Updates some fields to contain extra information
 *
 * @return {array} - An array of object literals, data valid for GSync
 */
function prepare_protected_fields() {
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
  names_array[0]["Home State"] = "CAAA";
  names_array[0]["Gender"] = "searching..."
  names_array[12]["Home State"] = "HO ME";
  names_array[12]["Major"] = "Sergeant"
  
  return names_array;
}

/**
 * @description - Creates a GSyncTable object, and calls the sync method on the data input
 */
function run_protected_fields(data) {
  var key_cols = ['Student Name'];
  var header_row = 1;
  var optional = {protectedFields: ["Home State"]};
  var sheet = SpreadsheetApp.openById(SYSTEM_TEST_SPREADSHEET_ID).getSheetByName('Sheet4');
  var object = new GSyncTable(sheet,
                              header_row,
                              key_cols,
                              optional);
  object.sync(data)
}

/**
 * @description - Reads some cell values to verify if:
 *                  The updates went through successfully,
 *                  Whether the "Home State" column's cells were updated or not.
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_protected_fields() {
  var value1 = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, "Sheet4!B2").values[0][0];  // Should be "searching..." (updated)
  var value2 = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, "Sheet4!D2").values[0][0];  // Should be "CAAA" (updated) as the cell is blank before sync)
  var value3 = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, "Sheet4!E14").values[0][0];  // Should be "Sergeant" (updated)
  var value4 = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, "Sheet4!D14").values[0][0];  // Should be "CA" (unchanged)

  if (value1 == "searching..." && value2 == "CAAA" && value3 == "Sergeant" && value4 == "CA") {
    return 'Success';
  } else {
    return 'Fail';
  }
}

/**
 * @description - Resets the sheet by clearing all data on this sheet (sheet 4),
 *                and copies over data from sheet 1 from the same spreadsheets
 */
function reset_protected_fields() {
  var data = Sheets.Spreadsheets.Values.get(SYSTEM_TEST_SPREADSHEET_ID, "Sheet1!A1:G31").values;
  Sheets.Spreadsheets.Values.clear({}, SYSTEM_TEST_SPREADSHEET_ID, "Sheet4")
  var resource = {
    "valueInputOption": "USER_ENTERED",
    "data": {
      "range": "Sheet4!A1:G31",
      "majorDimension": "ROWS",
      "values": data,
    }
  };
  Sheets.Spreadsheets.Values.batchUpdate(resource, SYSTEM_TEST_SPREADSHEET_ID);
  resource = {
    "range": "Sheet4!D2",
    "majorDimension": "ROWS",
    "values": [
      [""]
    ],
  };
  Sheets.Spreadsheets.Values.update(resource, SYSTEM_TEST_SPREADSHEET_ID, "Sheet4!D2", {"valueInputOption": "USER_ENTERED"});
}
