// USES SHEET 7 FROM GSYNC UNIT TEST SPREADSHEET (FOUND IN 'UnitTestSuite.gs')

/**
 * @description - Tests the data method of GSync, and verifies whether it correctly reads and interprets sheet data
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function test_readSheetData() {
  reset_readSheetData();
  
  var object = run_readSheetData();
  
  var result = verify_readSheetData(object);
  Logger.log(result);
  return result;
}

/**
 * @description - Creates a GSyncTable object for sheet 7 from the "GSYNC UNIT TEST SPREADSHEET"
 *
 * @return {object} - A GSyncTable object
 */
function run_readSheetData() {
  var key_cols = ['Student Name'];
  var header_row = 1;
  var sheet = SpreadsheetApp.openById(UNIT_TEST_SPREADSHEET_ID).getSheetByName('Sheet7');
  var object = new GSyncTable(sheet,
                              header_row,
                              key_cols);
  return object;
}

/**
 * @description - Calls the data method on the object, verfies the sheet data aginst the data from GSync
 *
 * @return {string} - The result of this test, 'Success' or 'Fail'
 */
function verify_readSheetData(object) {
  var data = object.readSheetData();

  
  var verification_array = ["Student Name", "Gender", "Major", "Extracurricular Activity", "Some Numbers"];
  for (var ix=0; ix<data.length; ix+=1) {
    var keys_array = Object.keys(data[ix]);
    for (var inx=0; inx<keys_array.length; inx+=1) {
      var value = keys_array[inx];
      if (!object.checkArrayInArray(verification_array, [value])) {
        console.error("The data method was unable to accurately read sheet data");
        return 'Fail';
      }
    }
  }
  
  // check random values?
  for (var ix=0; ix<data.length; ix+=1) {
    var key = data[ix]["Student Name"];
    if (key === "Alexandra") {
      var value1 = data[ix]["Major"];  // Should be English
    } else if (key === "Becky") {
      var value2 = data[ix]["Major"];  // Should be Art
    }
  }
  if (value1 != "English" || value2 != "Art") {
    console.error("The data method was unable to accurately read sheet data");
    return 'Fail';
  }
  
  return 'Success';
}

/**
 * @description - Clears the sheet of any data, writes rows 1 through 10 from sheet 1 onto this sheet (sheet 7)
 *                Removes the column headers for column C and D
 */
function reset_readSheetData() {
  var data = Sheets.Spreadsheets.Values.get(UNIT_TEST_SPREADSHEET_ID, "Sheet1!A1:G10").values;
  Sheets.Spreadsheets.Values.clear({}, UNIT_TEST_SPREADSHEET_ID, "Sheet7")
  var resource = {
    "valueInputOption": "USER_ENTERED",
    "data": {
      "range": "Sheet7!A1:G10",
      "majorDimension": "ROWS",
      "values": data,
    }
  };
  
  // Blanks out the headers for column C and D
  Sheets.Spreadsheets.Values.batchUpdate(resource, UNIT_TEST_SPREADSHEET_ID);
  resource = {
    "range": "Sheet7!C1:D1",
    "majorDimension": "ROWS",
    "values": [
      ["",""]
    ],
  };
  Sheets.Spreadsheets.Values.update(resource, UNIT_TEST_SPREADSHEET_ID, "Sheet7!C1:D1", {"valueInputOption": "USER_ENTERED"})
}
