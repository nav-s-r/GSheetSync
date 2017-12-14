## Contributing To GSheetSync

Firstly, thank you for taking the time to contribute!

Any and all contributions are appreciated, ranging from but not limited to:
* Adding new functionality
* Fixing a bug
* Making performance improvements
* Adding or Enhancing tests
* Refactoring code

It is highly advised that all development be done in Google's Script Editor, it does come with a lightweight logger and a built-in debugger.

## QuickStart (In Google's Script Editor)

* [Follow this link](https://script.google.com/intro) to go to Google's script editor
* Delete anything already on the script
* Copy and paste all code in [GSheetSync.js](GSheetSync.js) into a file on script editor
* Copy and paste ALL of the .js files in the [unit test](tests/unit_tests) and [system test](tests/system_tests) directories into SEPERATE files within the script editor
* Also copy [this file](tests/create_test_spreadsheets.js), to help you get the testing set up
* You can follow the more detailed [testing guide](#testing-your-contribution) below, as and when you're ready to test your contribution

## Coding Rules

* No specific rules, but be sure to run the code through [JSHint](http://jshint.com)

## Testing your contribution

All the tests use two spreadsheets containing a handful of worksheets, each worksheet is used for a seperate test. The tests manipulate data on these sheets and read values from them to verify whether the execution was a success of a failure.

You will need to have both of these spreadsheets in your drive before you begin, and you'll also have to fill in the IDs for these sheets in both the testing suites.
The following should help you get all of this set up properly.

1. Enable "Google Drive API" (Follow the steps from "Enabling APIs" in README.md)
2. Run the function "create_test_sheets_in_my_drive", found in "create_test_spreadsheets.js"
3. Two spreadsheets will be created in your drive, and two sets of spreadsheet IDs will be logged to both the built in logger and the console (stackdriver logging)
4. The files "UnitTestSuite.js" and "SystemTestSuite.js" both contain variables at the very top called "UNIT_TEST_SPREADSHEET_ID" and "SYSTEM_TEST_SPREADSHEET_ID" respectively, insert your newly created spreadsheets' IDs here
5. Run all tests, located in UnitTestSuite.js and the SystemTestSuite.js, you may have to wait between runs as google has certain usage quotas, and running both sets of tests definitely exceeds the 100 reads per 100 seconds quota.

All the individual tests return 'Success' for a pass and 'Fail' otherwise.
If you run all tests form either of the test suites, you are returned an array containing the test names and the results of the tests.
Please feel free to create new tests or update criteria for existing tests as you see fit.

Note:
Beware of google's read/write quotas. Limited to 100 read requests every 100 seconds, same limit for write requests. These limitations are places on the Sheets API, which all the tests use.
You may hit a quota error if you run all unit tests and run system tests right after, it wil be best to wait a minute and then run the system tests, and vice versa.

## Making a pull request

Read the following articles:
* [Fork a repo](https://help.github.com/articles/fork-a-repo/)
* [About pull requests](https://help.github.com/articles/about-pull-requests/)
* [Create a pull request from a fork](https://help.github.com/articles/creating-a-pull-request-from-a-fork/)

## Contact information

Email: navsgsheetsync@gmail.com
