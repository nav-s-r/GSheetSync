// All tests in this system test suite use the following spreadsheet:

var SYSTEM_TEST_SPREADSHEET_ID = '1xalWT2VJqea6YxPRkpftGduFE9mIdHJg3_wEJ1VOxvo'   // this is used for setHeaders_test script, and the createInternalDataStore_test script
// link to the sheet: https://docs.google.com/spreadsheets/d/1xalWT2VJqea6YxPRkpftGduFE9mIdHJg3_wEJ1VOxvo/edit?usp=sharing

function run_all_system_tests() {
  var results = [];
  
  var start = new Date();
  results.push(['sync_and_sort', test_sync_and_sort()]);
  var end = new Date();
  Logger.log('test_sync_and_sort');
  Logger.log('time taken in millieseconds: ' + (end - start) + '\n');
  
  start = new Date();
  results.push(['test_query_and_formulae', test_query_and_formulae()]);
  end = new Date();
  Logger.log('test_query_and_formulae');
  Logger.log('time taken in millieseconds: ' + (end - start) + '\n');
  
  start = new Date();
  results.push(['test_delete_and_undelete', test_delete_and_undelete()]);
  end = new Date();
  Logger.log('test_delete_and_undelete');
  Logger.log('time taken in millieseconds: ' + (end - start) + '\n');
  
  start = new Date();
  results.push(['test_protected_fields', test_protected_fields()]);
  end = new Date();
  Logger.log('test_protected_fields');
  Logger.log('time taken in millieseconds: ' + (end - start) + '\n');
  
  console.info(results);
  Logger.log(results);
}
