Getting Started
===============
GSheetSync is an Apps Script library to create, update and remove rows of data from a Google Sheets Spreadsheet. Inspired from the python module sheetsync_.

Motivation
-----------
Being able to query data using Google's BigQuery API in Apps Script and write that data directly onto a Google Sheets Spreadsheet, with the sync/inject functionality sheetsync_ provided.

This guide will get you set up to use GSheetSync in Google's Script Editor within a few minutes.

.. _sheetsync: http://sheetsync.readthedocs.io/en/latest

Installing GSheetSync
----------------------
First you need to open script editor. This is Google's very own development environment.
If you're new to Apps Script:

- Go to your `Google Drive`_
- Create a new spreadsheet. "New" > "Google Sheets"
- From the spreadsheet open Script editor, "Tools" > "Script Editor..."
- You should also read more about `bound scripts`_ or `standalone scripts`_, and about `Apps Script`_ itself

.. _Google Drive: https://drive.google.com/drive
.. _bound scripts: https://developers.google.com/apps-script/guides/bound
.. _standalone scripts: https://developers.google.com/apps-script/guides/standalone
.. _Apps Script: https://developers.google.com/apps-script

In Script Editor:

1. Click on the menu item "Resources" > "Libraries"
2. You should be prompted to enter a project name, choose a name and create the project
3. In the "Add a Library" text box, enter ``Moy3-vJh6VqHfyCZp1_rX-v1b9DGPvv-L``
4. Choose a version from the dropdown box (best to pick the latest version)
5. If you happen to have editor-level access for this library, ensure "Development Mode" is "off", otherwise it does not matter
6. Click the "Save" button

.. image:: images/install_library.jpg

Enbaling APIs
-------------

Two Google Advances API Services will need to be enabled before you continue with GSheetSync:

- Sheets API (V4)
- BigQuery API (V2)

In Script Editor:

- Go to "Resources" > "Advanced Google Services"
- Find and enable "BigQuery API"
- Find and enable "Google Sheets API"
- Follow the link at the bottom to "Google API Console"

.. image:: images/toggle_apis.jpg

In API Console:

Click on "ENABLE APIS AND SERVICES"

.. image:: images/google_dashboard.jpg

Search for "sheets" and follow the link

.. image:: images/sheets_search.jpg

Enable the API for your project

.. image:: images/enable_sheets.jpg

Repeat this for "BigQuery API" (ignoring "Bigquery Data Transfer API")

Injecting data to a Sheet
-------------------------

GSheetSync accepts data in a specific format.
The input data must be an array of JSON object literals. Each object within the array represents one row of data. Each key value pair represents a column header and its cell value.

The following array represents 3 rows of data, mapped by their column headers:

.. code-block:: javascript

    var data = [
      {"Name": "Alexander", "Class Level": "1. Freshman", "Extracurricular Activity": "Basketball"},
      {"Name": "Weeknd", "Extracurricular Activity": "Singing"},
      {"Name": "Dybala", "Class Level": "World", "Extracurricular Activity": "Football"}
    ]

To inject this data into a spreadsheet, use the following code:

.. code-block:: javascript

    function injectData() {
      var data = [
        {"Name": "Alexander", "Class Level": "1. Freshman", "Extracurricular Activity": "Basketball"},
        {"Name": "Weeknd", "Extracurricular Activity": "Singing"},
        {"Name": "Dybala", "Class Level": "World", "Extracurricular Activity": "Football"}
      ];
      
      var keyHeader = ["Name"];  // If your data table uses multiple keys, they all must be provided
      var headerRow = 1;
      var sheet = SpreadsheetApp.getActiveSheet();
      

      var target = new GSheetSync.GSyncTable(sheet,
                                             headerRow, 
                                             keyHeader);
      
      target.inject(data);
    }

      // NOTE: There are multiple ways to instantiate a google sheet object
      //       Any combination of the following would also work:
      //         SpreadsheetApp.openByUrl(YOUR SPREADSHEET URL).getSheetByName(YOUR SHEET NAME)
      //         SpreadsheetApp.openById(YOUR SPREADSHEET ID).getSheetByName(YOUR SHEET NAME)

This produces the following result

.. image:: images/injecting_data.jpg
