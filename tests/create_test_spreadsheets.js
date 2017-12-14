
/**
* @description - Creates two spreadsheets in your Google Drive, a unit test spreadsheet and a system test spreadsheet.
*                If you already have spreadsheets named "GSYNC UNIT TEST SPREADSHEET" or "GSYNC SYSTEM TEST SPREADSHEET",then nothing happens
*                Otherwsie, all sheets are copied from the unit test sheet:   https://docs.google.com/spreadsheets/d/1GrQbBLcx9wyleV90n596IXYWZT_d-QIVWn1Ahz2qBGo
*                                                and the system test sheet:   https://docs.google.com/spreadsheets/d/1bEvzHvaDkVlCehDflHoh_fpkDICEiMbtIRbQk627Ibg
*/
function create_test_sheets_in_my_drive() {
  var files = DriveApp.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (file.getName() == "GSYNC UNIT TEST SPREADSHEET") {
      var unit_ss_url = SpreadsheetApp.openById('1EOAOhv0VN_IB8VWwtSg5g8idD_723YuDE-XKkPtf_E0').getUrl();
      var message = ("You already have a spreadsheet named 'GSYNC UNIT TEST SPREADSHEET'." +
                     "Either rename this spreadsheet, or verify yourself that it contains all the sheets from: " +
                     unit_ss_url);
      Logger.log(message);
      console.error(message);
      return;
    } else if(file.getName() == "GSYNC SYSTEM TEST SPREADSHEET") {
      var sys_ss_url = SpreadsheetApp.openById('1xalWT2VJqea6YxPRkpftGduFE9mIdHJg3_wEJ1VOxvo').getUrl();
      var message = ("You already have a spreadsheet named 'GSYNC SYSTEM TEST SPREADSHEET'." +
                     "Either rename this spreadsheet and run this function again, or verify for yourself that this spreadsheet contains all the sheets from: " +
                     sys_ss_url);
      Logger.log(message);
      console.error(message);
      return;
    }
  }
  
  var unit_ss = SpreadsheetApp.create("GSYNC UNIT TEST SPREADSHEET");
  var sys_ss = SpreadsheetApp.create("GSYNC SYSTEM TEST SPREADSHEET");
  
  Logger.log("Unit Test Spreadsheet created at: " + unit_ss.getUrl());
  console.info("Unit Test Spreadsheet created at: " + unit_ss.getUrl());
  
  Logger.log("Unit Test Spreadsheet ID: " + unit_ss.getId());
  console.info("Unit Test Spreadsheet ID: " + unit_ss.getId());
  
  Logger.log("System Test Spreadsheet createed at: " + sys_ss.getUrl());
  console.info("System Test Spreadsheet createed at: " + sys_ss.getUrl());
  
  Logger.log("System Test Spreadsheet ID: " + sys_ss.getId());
  console.info("System Test Spreadsheet ID: " + sys_ss.getId());
  
  // Copying all the individual unit test sheets to your locally created unit test spreadsheet
  var sheets = SpreadsheetApp.openById("1EOAOhv0VN_IB8VWwtSg5g8idD_723YuDE-XKkPtf_E0").getSheets();
  var target = SpreadsheetApp.openById(unit_ss.getId());
  for (var ix=0; ix<sheets.length; ix+=1) {
    var sheet = sheets[ix];
    sheet.copyTo(target);
  }
  
  // Removing the default "Sheet1" sheet in unit test spreadsheet
  var unit_sheet_1 = SpreadsheetApp.openById(unit_ss.getId()).getSheetByName("Sheet1");
  unit_ss.deleteSheet(unit_sheet_1);
  
  // Need to rename all the sheets in the unit test spreadsheet, so they no longer contain "Copy of " in their titles
  sheets = SpreadsheetApp.openById(unit_ss.getId()).getSheets();
  for (var ix=0; ix<sheets.length; ix+=1) {
    var sheet = sheets[ix];
    var sheet_name = sheet.getSheetName();
    // Changing the sheet name to remove the "Copy of " from the front
    if (sheet_name.indexOf("Copy of ") != -1) {
      sheet_name = sheet_name.replace("Copy of ", "");
    }
    var resource = {
      "requests": [{
        "updateSheetProperties": {
          "properties": {
            "sheetId": sheet.getSheetId(),
            "title": sheet_name
          },
          "fields": "title",
        }
      }]
    };
    Sheets.Spreadsheets.batchUpdate(resource, unit_ss.getId());
  }
  
  // Copying all the inidividual system test sheets to your locally created system test spreadsheet
  sheets = SpreadsheetApp.openById("1xalWT2VJqea6YxPRkpftGduFE9mIdHJg3_wEJ1VOxvo").getSheets();
  target = SpreadsheetApp.openById(sys_ss.getId());
  for (ix=0; ix<sheets.length; ix+=1) {
    var sheet = sheets[ix];
    sheet.copyTo(target);
  }
  
  // Removing the default "sheet1" sheet in sys test spreadsheet
  var sys_sheet_1 = SpreadsheetApp.openById(sys_ss.getId()).getSheetByName("Sheet1");
  sys_ss.deleteSheet(sys_sheet_1);
  
  // Need to rename all the sheets in the system test spreadsheet, so they no longer contain "Copy of " in their titles
  sheets = SpreadsheetApp.openById(sys_ss.getId()).getSheets();
  for (var ix=0; ix<sheets.length; ix+=1) {
    var sheet = sheets[ix];
    var sheet_name = sheet.getSheetName();
    // Changing the sheet name to remove the "Copy of " from the front
    if (sheet_name.indexOf("Copy of ") != -1) {
      sheet_name = sheet_name.replace("Copy of ", "");
    }
    var resource = {
      "requests": [{
        "updateSheetProperties": {
          "properties": {
            "sheetId": sheet.getSheetId(),
            "title": sheet_name
          },
          "fields": "title",
        }
      }]
    };
    Sheets.Spreadsheets.batchUpdate(resource, sys_ss.getId());
  }
}
