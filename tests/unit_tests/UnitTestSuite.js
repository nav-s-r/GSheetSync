// for testing purposes we will use a handful of sheets that are available for 'view' to anyone on the internet.

// this spreadsheet contains 9 sheets which are used for one pupose or another for the 9 unit tests in this file.
var UNIT_TEST_SPREADSHEET_ID = '1EOAOhv0VN_IB8VWwtSg5g8idD_723YuDE-XKkPtf_E0'
// link to the sheet: https://docs.google.com/spreadsheets/d/1EOAOhv0VN_IB8VWwtSg5g8idD_723YuDE-XKkPtf_E0/edit?usp=sharing


function run_all_tests() {
  var results = [];
  results.push(['test_setHeaders', test_setHeaders(), Logger.log('\nsetHeaders\n')]);
  results.push(['test_createInternalDataStore', test_createInternalDataStore(), Logger.log('\ncreateInternalDataStore\n')]);
  results.push(['test_updateInternalDataStore', test_updateInternalDataStore(), Logger.log('\nupdateInternalDataStore\n')]);
  results.push(['test_addUpdateRequest', test_addUpdateRequest(), Logger.log('\ntest_addUpdateRequest\n')]);
  results.push(['test_writeRequests', test_writeRequests(), Logger.log('\nwriteRequests\n')]);
  results.push(['test_deleteRows', test_deleteRows(), Logger.log('\ndeleteRows\n')]);
  results.push(['test_update', test_update(), Logger.log('\nupdate\n')]);
  results.push(['test_setFormulae', test_setFormulae(), Logger.log('\nsetFormulae\n')]);
  results.push(['test_convertBigQueryResults', test_convertBigQueryResults(), Logger.log('\nconvertBigQueryResults\n')]);
  results.push(['test_readSheetData', test_readSheetData(), Logger.log('\nreadSheetData\n')]);
  console.info(results);
  Logger.log(results);
}
