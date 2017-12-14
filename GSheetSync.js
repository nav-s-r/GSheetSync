/** 
 *  @fileOverview Allows the user to Create, update and remove rows,
 *                from within a Google Sheets Spreadsheet,
 *                by modelling it as a table of data.
 *
 *  @author       Navroj Singh
 *
 *  @requirements Google Sheets API (v4)
 *  @requirements Google BigQuery API (v2)
 */


/**
 * @description - Takes a google sheet object, and creates an instance of a GSyncTable object.
 *                This object represents a table of data in a worksheet.
 *                GSyncTable methods allow for changing the fields and rows of data in the sheet.
 *
 * @param  {object}       sheet         (Required) - An instance of a Google Spreadsheet Sheet class
 *                                                   (Described here: https://developers.google.com/apps-script/reference/spreadsheet/sheet)
 * @param  {string,array} keyColHeaders (Required) - The name of the column containing unique keys for each row
 *                                                   If unique keys span multiple columns, you can provide an array of column headers.
 * @param  {number}       headerRow     (Required) - A row number identifying location of the headers row on the sheet
 * @param  {object}       optionalArgs  (Optional) - An object literal that will allow the user to pass in some optional parameters, namely:
 *                                                     formulaRow      - A number representing the position of the formula row on the sheet
 *                                                     protectedFields - An array containing headers as strings, this determines which columns should be seen as protected
 *                                                                       So if those columns contain values, those values will not be overwritten by GSheetSync regardless of the data input
 *                                                     Example input> optionalArgs = {formulaRow: 2,
 *                                                                                    protectedFields: ["Header_2", "Header_7"]}
 */
var GSyncTable = function(sheet,
                          headerRow,
                          keyColHeaders,
                          optionalArgs) {
  var result, count;
  if (typeof sheet !== "object") {
    if (typeof sheet.getId() !== "number") {
      throw "ERROR! The first argument must be a google sheet object: https://developers.google.com/apps-script/reference/spreadsheet/sheet";
    }
  }
  if (typeof headerRow !== "number" || headerRow <= 0) {
    throw "ERROR! The second argument must be a non-zero positive integer representing the position of the headers row on the sheet";
  }
  if ((Object.prototype.toString.call(keyColHeaders) !== "[object Array]") ||
      (keyColHeaders.length <= 0)) {
    if (typeof keyColHeaders !== "string") {
      throw "ERROR! The keyColHeaders argument must be a non-empty Array or a non-empty stirng";
    }
  }
  // Validating and assigning variables for the optional argument object
  if (optionalArgs) {
    if (optionalArgs.formulaRow !== undefined) {
      if (typeof optionalArgs.formulaRow !== "number" || formulaRow <= 0) {
        throw "ERROR! The formulaRow argument must be a non-zero positive integer";
      } else {
        var formulaRow = optionalArgs.formulaRow;
      }
    } else {
      formulaRow = 0;
    }
    if (optionalArgs.protectedFields !== undefined) {
      if (Object.prototype.toString.call(optionalArgs.protectedFields) !== "[object Array]") {
        throw "ERROR! The protectedFields argument, be an array object"
      } else {
        var protectedFields = optionalArgs.protectedFields;
      }
    } else {
      protectedFields = [];
    }
  } else {
    var protectedFields = [];
    var formulaRow = 0;
  }
  if (typeof keyColHeaders === "string") {
    keyColHeaders = [keyColHeaders];
  }
  // Setting class-wide variables
  this.sheet = sheet;
  this.spreadsheetId = sheet.getParent().getId();
  this.sheetName = sheet.getName();
  this.headersRowNum = headerRow;
  this.keyColHeaders = keyColHeaders;
  this.formulaRow = formulaRow;
  this.protectedFields = protectedFields;
  
  // internalDataStore is the internal data structure GSheetSync uses
  this.internalDataStore = {};
  // batchData is the array in which update requests are stored, to be called later for a batch update
  this.batchData = [];
  // The array to replace a full row with a blank row (empty strings) this is updated in the setHeaders() method
  this.blankArray = [];
  // 'this.originalHeaders' tracks whether the headers row is empty or not
  this.originalHeaders = true;
  
  // The 3 main objects used to keep track of columns, updated in the setHeaders method
  // These 3 will be used in conjunction to identify column numbers and map cells to their column headers
  this.headersToCol = {};
  this.indexToHeaders = {};
  this.headersToIndex = {};
  
  // An empty responce error will cause the function to return false
  count = 0;
  do {
    result = this.setHeaders();
    if (result === false) {
      console.log("Sheets API gave an empty responce, re-attempting");
    }
    count += 1;
  }
  while (result === false && count < 3);
  if (result === false) {
    throw "Error! Google Sheets api became unresponsive, try again.";
  }
  
  // These 2 objects are created in thie setFormulae() method
  // The latter is then used while writing formula requests in the writeRequests() method
  this.headersToFormulae = {};
  this.formulaeRequests = [];
  
  // Creating an array contianing object literals, to match the data type accepted by GSheetSync, mapping column headers with cell values for each row
  // Example: [{"header1": "row1_value1", "header2": "row1_value2"},
  //           {"header1": "row2_value1", "header2": "row2_value2"}]
  this.data = [];
  
  this.determineLastRow();
};

/**
 *
 *
 */
GSyncTable.prototype.determineLastRow = function determineLastRow() {
  // These are used in some methods to determine the rows after which new data can be inserted
  // lastRowNum is used in a lot of places to calculate the current state of the sheet (if it's blank etc.)
  var firstKeyColHeader = this.headersToCol[this.keyColHeaders[0]];
  var range = this.sheetName + "!" + firstKeyColHeader + ":" + firstKeyColHeader;
  
  this.maxReservedRow = Math.max(this.headersRowNum, this.formulaRow);
  this.lastRowNum = (this.maxReservedRow) + (+1);
  // just to get a starting point for the "lastRowNum"
  if (this.originalHeaders === true) {
    try {
      this.lastRowNum = Sheets.Spreadsheets.Values.get(this.spreadsheetId, range).values.length;
    } catch (err) {
      this.lastRowNum = this.sheet.getLastRow();
    }
    if (this.lastRowNum <= this.maxReservedRow) {
      this.lastRowNum = this.maxReservedRow;
    }
    this.lastRowNum += 1;
  }
}

/**
 * @description - Reads the sheet's headers row and creates an object to map headers (as keys) to columns (as values),
 *                columns are stored in A1 notation, so the first column would be 'A', the 27th column would be 'AA'.
 *                A further two objects are also updated here, indexToHeaders and headersToIndex,
 *                these store headers with their columns, column 1 being '0', column 27 being '26'.
 *                An additional headers array can be passed in, at which point the method updates/extends all 3 objects appropriately.
 *
 * @param  {array} additionalHeaders (Optional) - An array containing all the headers that are mentioned in the input data
 */
GSyncTable.prototype.setHeaders = function setHeaders(additionalHeaders) {
  console.log("Executing setHeaders");
  var newHeaders, headersArray, uniqueHeadersArray, args, range, maxCols, sheetHeaders, i, lastColNum;
  // Are there addtional headers being passed in?
  if (additionalHeaders) {
    console.log("setHeaders: additional headers have been passed in");
    if (Object.prototype.toString.call(additionalHeaders) !== "[object Array]") {
      throw "setHeaders: ERROR! argument is not an array object";
    }
    // Removing potential duplicates from the headers passed in
    additionalHeaders = this.uniqueArray(additionalHeaders);
    
    // Creating an array form the headers already mapped/stored by this method
    sheetHeaders = [];
    for (var key in this.headersToCol) {
      if (this.headersToCol.hasOwnProperty(key)) {
        sheetHeaders.push(key);
      }
    }
    newHeaders = [];
    for (i = 0; i < additionalHeaders.length; i += 1) {
      // Are any of the new headers not already in the sheet headers?
      if (sheetHeaders.indexOf(additionalHeaders[i]) == -1) {
        newHeaders.push(additionalHeaders[i]);
      }
    }
  } else {
    console.log("setHeaders: Reading headers row from the sheet");
  }
  // Preparing to read headers row data from the sheet
  args = {"valueRenderOption": "UNFORMATTED_VALUE"};
  range = this.sheetName + "!" + this.headersRowNum +":" + this.headersRowNum;
  if (this.originalHeaders === true) {
    try{
      try {
        headersArray = Sheets.Spreadsheets.Values.get(this.spreadsheetId,
                                                      range,
                                                      args).values[0];
      } catch (err if err instanceof TypeError) {
        // This variable is used later when we update the internal data store by reading from the sheet.
        this.originalHeaders = false;
        return true;
      }
      // Headers row may be empty
    } catch (err) {
      if (err == "Exception: Empty response") {
        console.log("A Google service call has resulted in an 'Empty Responce' error, attempting to continue...");
        return false;
      } else {
        throw err;
      }
    }
    
    uniqueHeadersArray = this.uniqueArray(headersArray);
    // Are any two headers the same value?
    if (uniqueHeadersArray.length != headersArray.length) {
      var results = this.findDuplicatesInArray(headersArray);
      if (results.length > 1) {
        var message = "Error! The following column headers are repeated at least twice: ";
        for (var ix=0; ix<results.length; ix+=1) {
          message += results[ix];
          if (ix != (results.length - 1)) {
            message += ", ";
          } else {
            message += ".\n";
          }
        }
        message += ("Note: GSheetSync does not allow for any two columns having the same header.");
        throw message;
      } else if (results.length = 1) {
        throw ("Error! The column header " + "'" + results[0] + "' is repeated at least twice\n" +
               "GSheetSync does not allow repeated headers");
      }
    }
  } else {
    headersArray = [];
  }
  if (newHeaders) {
    for (i = 0; i < newHeaders.length; i += 1) {
      headersArray.push(newHeaders[i]);
    }
  }
  maxCols = Math.max(headersArray.length, this.sheet.getLastColumn());
  // Creates an object mapping indexes with their appropriate 'A1' counterpart
  // Index 0 would correspond to 'A'.
  this.indexToAlphabet = this.createA1Mapping(maxCols - 1);
  
  // Finally we create the 3 objects that will be used in later methods
  for (i = 0; i < headersArray.length; i += 1) {
    var header = headersArray[i];
    this.headersToCol[header] = this.indexToAlphabet[i];
    this.indexToHeaders[i] = header;
    this.headersToIndex[header] = (i);
  }
  // Have the number of columns surpassed the sheet's current grid limit?
  if (headersArray.length > this.sheet.getMaxColumns()) {
    // Adds 10 columns at a time, to the end of the sheet, if the current amount of columns is greate than
    var extraCols = headersArray.length - this.sheet.getMaxColumns();
    this.sheet.insertColumnsAfter(this.sheet.getMaxColumns(), extraCols);
    SpreadsheetApp.flush();
  }
  // This creates a blank array, the length of which is the total number of columns
  lastColNum = headersArray.length;
  this.blankArray = new Array(lastColNum).join(".").split(".");
  console.log("Completed setHeaders");
  return true;
};


/**
 * @description - Creates an object that maps column headers with the formulae that will later go in those columns
 */
GSyncTable.prototype.setFormulae = function setFormulae(rowNumber, endRowNumber) {
  var range, formulae, i ,cellValue, header, col, newRange, formula, requests;
  
  // Create batch update requests for the formulae
  if (endRowNumber !== undefined) {
    this.formulaeRequests = [];
    for (header in this.headersToFormulae) {
      if (this.headersToFormulae.hasOwnProperty(header)) {
        // Create a cell request for each formula column
        requests = {
          "repeatCell": {
            "range": {
              "sheetId": this.sheet.getSheetId(),
              "startRowIndex": rowNumber - 1,
              "endRowIndex": endRowNumber - 1,
              "startColumnIndex": this.headersToIndex[header],
              "endColumnIndex": (+this.headersToIndex[header]) + (+1)
            },
            "cell": {
              "userEnteredValue": {
                "formulaValue": this.headersToFormulae[header][0][0]
              }
            },
            "fields": "userEnteredValue"
          }
        };
      }
      this.formulaeRequests.push(requests);
    }
    
  } else {
    // Creating the object that will map a column header with the formula in the column
    if (this.formulaRow) {
      this.headersToFormulae = {};
      range = this.sheetName + '!' + this.formulaRow + ':' + this.formulaRow;
      // Capture cell value as a formula
      try {
        formulae = Sheets.Spreadsheets.Values.get(this.spreadsheetId,
                                                  range,
                                                  {"valueRenderOption": "FORMULA"}).values[0];
      } catch (err) {
        if (err == "Exception: Empty response") {
          console.log("A Google service call has resulted in an 'Empty Responce' error, attempting to continue...");
          return false;
        } else if (err instanceof TypeError) {
          this.headersToFormulae = {};
          return true;
        } else {
          throw err;
        }
      }
      for (i = 0; i < formulae.length; i += 1) {
        cellValue = formulae[i];
        // Cells may be blank, every column won't have a formula
        if (cellValue !== undefined && cellValue !== "") {
          header = this.indexToHeaders[i];
          if (header === undefined || header === "") {
            console.info("Formula columns must have a header value, else the formula will not be applied to the column");
            continue;
          }
          col = this.headersToCol[header];
          // Get the formula value for the start of this range.
          range = this.sheetName + '!' + col + this.formulaRow;
          range = this.sheet.getRange(range);
          newRange = this.sheetName + '!' + col + rowNumber;
          newRange = this.sheet.getRange(newRange);
          range.copyTo(newRange);
          newRange.setFormulas(newRange.getFormulas());
          formula = newRange.getFormulas();
          // clear the formulae once we know what the correct incrementation is. don't want to leave formulae laying around in a sheet
          newRange.clearContent();
          // flush the 'clearContent' asap, SpreadsheetApp has unnecessarily complicated optimizations that bundle jobs together. dont want that here
          // The last formula cell to be written to, may not be cleared till the end of the script, removing cell values
          SpreadsheetApp.flush();
          if (!formula[0][0]) {
            // Don't wan't Formulae that aren't actual formulae.. i.e if someone eccidentally puts a 3 in the formula row
            // There's no point for that to replace the data with 3s
            continue;
          }
          // Create the headersToFormulae object
          this.headersToFormulae[header] = formula;
        }
      }
    }
  }
  return true;
};

/**
 * @description - Makes a call to the update method, which handles all further actions
 *                Also tells the update method how to handle data that is present in the sheet but not present in the input data being synchronised
 *                The sync method will add a ' (DELETED)' string to the end of all the primary keys if said row isn't also present in the data being synced
 *
 * @param  {array}   rawData   (Required) - Input data to update the sheet with. Must be an array containing objects. 
 * @param  {boolean} removeRow (Optional) - If this is set to true, any rows that are in the sheet but not in the input data, will be removed from the sheet
 * @param  {boolean} undelete  (Optional) - If true, it will go through all the primary keys on the sheet,
 *                                          and for all the keys that contian delete flags, it will remove the flags and continue with the synchronisation.
 *                                          What this means is, if a key was flagged as deleted, but is now somehow back in the raw data, if can be 'undeleted'
 */
GSyncTable.prototype.sync = function sync(rawData, removeRow) {
  /*
  var doc_lock = LockService.getDocumentLock();
  var script_lock = LockService.getScriptLock();
  script_lock.waitLock(180000);
  doc_lock.waitLock(180000);
  */
  
  this.update(rawData, true, removeRow);
  console.info("Syncing data with the sheet");
  if (removeRow === true) {
    console.info("Note: rows that aren't in the input data, have been removed from the sheet");
  } else {
    console.info("Flagging relevant rows for deletion.\nNote: Rows will not be removed from the sheet, as per the user's request");
  }
  
  this.resetInternalObjects();
};

/**
 * @description - Makes a call to the update method, which updates the sheet object
 *                Doesn't 'delete' any missing cells, simply updates existing rows and adds new rows
 *
 * @param  {array} rawData (Required) - Input data to update the sheet with. Must be an array contianing objects.
 */
GSyncTable.prototype.inject = function inject(rawData) {
  /*
  var doc_lock = LockService.getDocumentLock();
  var script_lock = LockService.getScriptLock();
  script_lock.waitLock(180000);
  doc_lock.waitLock(180000);
  */
  
  this.update(rawData);
  console.info("Injecting data into the sheet");
  
  this.resetInternalObjects();
};

/**
 * @description - Updates the cell values in the sheet with changes specified in the rawData, can removeRows if called from the sync method
 *
 * @param  {array}   rawData    (Required) - Input data to update the sheet with. Must be an array containing objects.
 * @param  {boolean} deleteFlag (Optional) - If this is true, then a ' (DELETED)' string is added to the primary keys of a row if that row isn't in input data but is in the sheet
 * @param  {boolean} removeRow  (Optional) - If this is true, then the rows that aren't in input data, but are in the sheet, will be deleted
 */
GSyncTable.prototype.update = function update(rawData, deleteFlag, removeRow) {
  console.log("Executing update");
  var currentLastRow, pKey, rawValuesObject, sheetValuesObject, cellValue,
      rowNum, header, i, rowsToDelete, rawHeaders, startRow, count, result;
  
  
  // Set headers by reading the sheet
  do {
    result = this.setHeaders();
    if (result === false) {
      console.log("Sheets API gave an empty responce, re-attempting");
    }
    count += 1;
  }
  while (result === false && count < 3);
  if (result === false) {
    throw "Error! Google Sheets api became unresponsive, try again.";
  }

  // Create and updating the internal data structure
  // 'createInternalDataStore' also calls setHeaders to add rawData headers in
  this.createInternalDataStore(rawData);
  count = 0;
  do {
    result = this.updateInternalDataStore();
    if (result === false) {
      console.log("Sheets API gave an empty responce, re-attempting");
    }
    count += 1;
  }
  while (result === false && count < 3);
  if (result === false) {
    throw "Error! Google Sheets api became unresponsive, try again.";
  }
  
  // Verify whether the user specified key header is even in the headers objects
  for (var ix=0; ix<this.keyColHeaders.length; ix+=1) {
    // Verify that each key column header is indeed contianed within our main header mapping object
    if (!this.checkArrayInArray(Object.keys(this.headersToCol), (this.keyColHeaders[ix]))) {
      throw "The headers from keyColHeaders must be present in either the sheet data or the raw data."
    }
  }
  
  rowsToDelete = [];
  // Ensuring completetion of all SpreadsheetApp methods, before getting the last row
  SpreadsheetApp.flush();
  // The last row containing any data
  this.determineLastRow();
  // currentLastRow is used when injecting new data onto the first blank row (1 after the last row that contains any data)
  // If the sheet isn't blank, this variable needs to be 1 more than the current last row
  currentLastRow = this.lastRowNum;
  
  
  count = 0;
  do {
    result = this.resetFilterViews();
    count += 1;
  } while (result === false && count <3);
  if (result === false) {
    throw "Error! Google Sheets api became unresponsive, try again.";
  }
  
  // Adding an additional row if necessary
  if (currentLastRow > this.sheet.getMaxRows()) {
    this.sheet.insertRowsAfter(this.sheet.getMaxRows(), 1);
  }
  SpreadsheetApp.flush();
  startRow = currentLastRow;
  this.setFormulae(startRow);

  // Give the last row number to setFormulae so that it can update the formulaToHeaders

  // Loop through each object within the internalDataStore object
  // Each object represents one line of data
  for (pKey in this.internalDataStore) {
    if (this.internalDataStore.hasOwnProperty(pKey)) {
      if (pKey.length = 0) {
        continue;
      }
      // rawData correponding to this primary key(s), if any
      rawValuesObject = this.internalDataStore[pKey].rawRow;
      // sheet data correponding to this primary key(s), if any
      sheetValuesObject = this.internalDataStore[pKey].sheetRow;
      rowNum = this.internalDataStore[pKey].rowNumber;
      
      // Is there any new raw data corresponding to this primary key(s) array? ('pKey')
      // If not, then we may need to mark these sheet rows for deletion
      if (!rawValuesObject) {
        if (removeRow) {
          rowsToDelete.push(rowNum);
        } else if (deleteFlag){
          this.deleteRows(rowNum, pKey);
        }
      }
      
      // Is there any sheet data corresponding to this primary key(s) array?
      if (!sheetValuesObject) {
        // If not,then we simply add the entire raw data set for this particular row into the sheet
        // Data will be added in the first available row below the last used row
        rawHeaders = Object.keys(rawValuesObject);
        for (i = 0; i < rawHeaders.length; i += 1) {
          rowNum = currentLastRow;
          cellValue = rawValuesObject[rawHeaders[i]];
          // If we hit the sheet's grid limit for rows, extend the rows by 500
          if (rowNum >= this.sheet.getMaxRows()) {
            this.sheet.insertRowsAfter(this.sheet.getMaxRows(), 500);
            SpreadsheetApp.flush();
          }
          // Send update requests to be created
          this.addUpdateRequest(cellValue, rawHeaders[i], rowNum);
        }
        currentLastRow += 1;
      }
      
      // If there is both sheet data and rawData, individual values must be compared to verify 
      if (sheetValuesObject && rawValuesObject) {
        // Here we have sheet data, and also new raw data corresponding to that exact primary key(s) array
        // This will genenrally be the main case out of the three GSheetSync use cases
        // GSheetSync needs to compare each value and check for changes in each value
        for (header in rawValuesObject) {
          if (rawValuesObject.hasOwnProperty(header)){
            var valueFromSheet = sheetValuesObject[header],
                valueFromRaw = rawValuesObject[header];
            // Check for changes in value
            if (valueFromRaw != valueFromSheet) {
              // Does this cell currently contain any data?
              if (valueFromSheet == "") {
                // Send changes to be written
                this.addUpdateRequest(valueFromRaw, header, rowNum);
              } else {
                // Otherwise we need to send an additional parametrs
                // This will determine if the value is written of not
                // Depending on whether this cellvalue is from a protected field or not
                this.addUpdateRequest(valueFromRaw, header, rowNum, true);
              }
            }
          }
        }
      }
    }
  }
  this.setFormulae(startRow, currentLastRow);
  // Write all current cell value update requests
  count = 0;
  do {
    result = this.writeRequests();
    if (result === false) {
      console.log("Sheets API gave an empty responce, re-attempting");
    }
    count += 1;
  }
  while (result === false && count < 3);
  if (result === false) {
    throw "Error! Google Sheets api became unresponsive, try again.";
  }
  console.log("update: cell updates have been written to the sheet");
  // Prep for deletion of rows (if any were specified in the for loop above)
  // rowsToDelete is an array of row numbers
  if (rowsToDelete) {
    console.info("Deleting any rows not synchronised with the input data");
    for (i = 0; i < rowsToDelete.length; i += 1) {
      // bklank the rows here instead of deleting them
      this.deleteRows(rowsToDelete[i]);
    }
    console.log("update: rows identified for deletion have now been deleted from the sheet");
  }
  // Writes all updates that clear any unsynchronised rows
  count = 0;
  do {
    result = this.writeRequests();
    if (result === false) {
      console.log("Sheets API gave an empty responce, re-attempting");
    }
    count += 1;
  }
  while (result === false && count < 3);
  if (result === false) {
    throw "Error! Google Sheets api became unresponsive, try again.";
  }
  
  console.log("Completed update");
};

/**
 * @description - Resets all filters on a sheet, if rows were hidden, they are no longe hidden
 *
 * @return {boolean} - Determines whether the sheets api call made in this method was sucessful or not
 */
GSyncTable.prototype.resetFilterViews = function resetFilterViews() {
  var maxRow, maxCol, rowStart, colStart;
  
  maxRow = this.sheet.getMaxRows();
  maxCol = this.sheet.getMaxColumns();
  rowStart = this.headersRowNum - 1;
  colStart = 0;
  
  var filterSettings = {
    "range": {
      "sheetId": this.sheet.getSheetId(),
      "startRowIndex": rowStart,
      "endRowIndex": maxRow,
      "startColumnIndex": colStart,
      "endColumnIndex": maxCol
    }
  };
  var requests = [{
    "setBasicFilter": {
      "filter": filterSettings
    }
  }];
  try {
    Sheets.Spreadsheets.batchUpdate({'requests': requests}, this.spreadsheetId);
  } catch (err) {
    if (err == "Exception: Empty response") {
      console.log("A Google service call has resulted in an 'Empty Responce' error, attempting to continue...");
      return false;
    } else {
      throw err;
    }
  }
  return true;
}

/**
 * @description - Prepares data in the format appropriate for use with Google's Sheets Api (v4).
 *                The array this.batchData is appended with cell value updates on each call of this method.
 *
 * @param  {string}  cellValue       (Required) - The value that will go in an individual cell
 * @param  {string}  header          (Required) - The header with which the cellValue is assosiated
 * @param  {integer} rowNumber       (Required) - The row number corresponding to a cell's location
 * @param  {boolean} verifyProtected (Optional) - Only passed in when old rows' cells are being updated with new values form raw data
 *                                                Here we determine whether to add thes updates or not, as some fields may be specified as "protectedFields".
 */
GSyncTable.prototype.addUpdateRequest = function addUpdateRequest(cellValue, header, rowNumber, verifyProtection) {
  var col, range, data;
  // Can't think of a graceful way to handle this, in testing these turn out as undefined sometimes and 
  // those errors show up later down the line, and its' irritating tracking back.
  // For production, this needs to be changed around
  if (cellValue === undefined) {
    throw 'addUpdateRequest: undefined argument for cellValue';
  } else if (rowNumber === undefined) {
    throw 'addUpdateRequest: undefined argument for rowNumber';
  }
  
  // Preparing variables to create the data set taken by the Sheets (v4) update requests
  if (header === undefined) {
    //console.log('Row ' + rowNumber + ' is queued for deletion');
    // Preparing variables for a blank row update request (adding a blank array which is the size of the row)
    range = this.sheetName + '!' + rowNumber + ':' + rowNumber;
    
  } else {

    if (verifyProtection === true) {
      // Verify whether this cell value is in a protected field
      if (this.checkArrayInArray(this.protectedFields, [header])) {
        return;
      }
    }
    // Preparing variables for a cell value update request (a single cell)
    col = this.headersToCol[header];
    range = (this.sheetName + "!" + col + rowNumber);
    cellValue = [cellValue];
  }
  data = {
    "range": range,
    "values": [cellValue]
  };
  this.batchData.push(data);
};

/**
 * @description - There are some internal objects that track various amounts of information about the sheet.
 *                This method resets these internal data objects. The aim here is to avoid conflicts if multiple syncs or injects
 *                are called on the same GSyncTable object.
 */
GSyncTable.prototype.resetInternalObjects = function resetInternalObjects() {
  
  var a1Range = this.headersToCol[this.keyColHeaders[0]] + this.headersRowNum;
  var header = [[this.keyColHeaders[0]]];
  
  // Making a write using SpreadsheetApp
  // Purely for the sake of the SpreadsheetApp methods recognising that the sheet object has indeed been "updated"
  // write the first key column header into the sheet object in its current place using spreadsheetapp instead of sheets api.
  SpreadsheetApp.openById(this.spreadsheetId).getSheetByName(this.sheetName).getRange(a1Range).setValues(header);
  
  // Calculating the last row that doesn't contain any data
  var firstKeyColHeader = this.headersToCol[this.keyColHeaders[0]];
  var range = this.sheetName + "!" + firstKeyColHeader + ":" + firstKeyColHeader;

  this.determineLastRow();
  
  // Resetting internal objects
  this.headersToCol = {};
  this.batchData = [];
  this.indexToAlphabet = {};
  this.indexToHeaders = {};
  this.headersToIndex = {};
  this.internalDataStore = {};
  this.originalHeaders = true;
};

/**
 * @description - Runs a batch update, which uses the this.batchData to carry out cell value updates
 *                This method utilizes Google's Sheets Api (v4).
 */
GSyncTable.prototype.writeRequests = function writeRequests() {
  var resource;
  // Is there any data to actually write?
  if (!this.batchData) {
    return true;
  } else {
    if (this.formulaeRequests.length > 0) {
      // First add any current formulae
      // as if there are raw values to override potential formula cells, they will override them in this order
      resource = {
        "requests": this.formulaeRequests
      };
      try {
        Sheets.Spreadsheets.batchUpdate(resource,
                                        this.spreadsheetId);
      } catch (err) {
        if (err == "Exception: Empty response") {
          console.log("A Google service call has resulted in an 'Empty Responce' error, attempting to continue...");
          return false;
        } else {
        throw err;
      }
    }
      console.log("writeRequests: all pending formula reqquests has now been carried out");
      this.formulaeRequests = [];
    }
    // Now queue the cell value updates
    resource = {"valueInputOption": "USER_ENTERED",
                "includeValuesInResponse": false,
                "data": this.batchData};
    try {
      Sheets.Spreadsheets.Values.batchUpdate(resource,
                                             this.spreadsheetId);
    } catch (err) {
      if (err == "Exception: Empty response") {
        console.log("A Google service call has resulted in an 'Empty Responce' error, attempting to continue...");
        return false;
      } else {
        throw err;
      }
    }
    this.batchData = [];
    console.log("writeRequests: all pending update requests have now been carried out");
    return true;
  }
};

/**
 * @description - Handles all the cell changes due to the "sync" method, by delegating updates requests to either add a "(DELETED)" tag
 *                to the data, or simply removing the required rows from the sheet object.
 *
 * @param  {number} rowNum (Required) - the row number in which any changes are to be made
 *                                       (changes may include addding delete tags or simply removing the whole row)
 * @param  {array}  pKey   (Optional) - the primary key(s) to make the changes to (only applies if we're adding delete tags)
 */
GSyncTable.prototype.deleteRows = function deleteRows(rowNum, pKey) {
  var header, newValue;
  // pKey is the primary key used to index data in the 'internalDataStore'
  if (pKey) {
    // If the primary keys array only contains one element, it is interpreted as a string, not as an array containing a string
    if (typeof pKey == "string") {
      header = this.keyColHeaders[0];
      newValue = pKey + " (DELETED)";
      this.addUpdateRequest(newValue, header, rowNum);
    } else {
      //add 'DELETED' tags to data
      for (var i = 0; i < pKey.length; i += 1) {
        // need the column header, updated value and row number to send the request to be created in addUpdateRequest
        header = this.keyColHeaders[i];
        newValue = pKey[i] + " (DELETED)";
        this.addUpdateRequest(newValue, header, rowNum);
      }
    }
  } else {
    this.addUpdateRequest(this.blankArray, undefined, rowNum);
  }
};

/**
 * @description - Sorts the sheet object by the headers specified
 *
 * @param  {boolean} order               (Required) - Decides whether to sort in ascending or descending order
 * @param  {array}   sortingOrderArray (Optional) - The column headers whose columns are sorted in ascending order
 */
GSyncTable.prototype.sortByHeaders = function sortByHeaders(order, sortingOrderArray) {
  var i, headerColIndex, sheetId, resource, sortSpecsArray = [];

  if (order === true || order === false) {
    if (sortingOrderArray) {
      if (Object.prototype.toString.call(sortingOrderArray) !== "[object Array]"){
        throw "The sortByHeaders method requires an array of column headers as the 2nd argument";
      }
    }
    if (order === true) {order = "Ascending";}
    if (order === false) {order = "Descending";}
    // Check if use has specified a sorting array
    if (!sortingOrderArray) {
      console.info("No sorting array specified, ordering sheet by key column header(s)");
      sortingOrderArray = this.keyColHeaders;
    }
    // Sorts the sheet based on the keys specified
    sortSpecsArray = [];
    for (i = 0; i < sortingOrderArray.length; i += 1) {
      headerColIndex = this.headersToIndex[sortingOrderArray[i]];
      sortSpecsArray.push(
        {dimensionIndex: headerColIndex, sortOrder: order}
      );
    }
  } else if (typeof order == "object"){
    sortSpecsArray = order;
  }
  
  // Creating request for sort based upon 'sortSpecsArray'
  sheetId = this.sheet.getSheetId();
  resource = {
    "requests": [
      {
        "sortRange": {
          "range": {
            "sheetId": sheetId,
            "startRowIndex": this.maxReservedRow
          },
          "sortSpecs": sortSpecsArray
        }
      }
    ]
  };
  
  try{
    Sheets.Spreadsheets.batchUpdate(resource,
                                    this.spreadsheetId);
  } catch (err) {
    console.error(err);
    return;
  }
  console.info('Sheet has been sorted in ascending order based upon the key column headers');
};

/**
 * @description - Creates an internal data type consisting of an object contianing two objects an a key-value pair, 
 *                The row objects represent rows of data, the first being the sheet's current data, the second being the raw input data.
 *                The third element is a key-value pair that tracks the row numbers for that row (only relevant if the row is currently present on the sheet)
 *                An example of this data structure is available on the updateInternalDataStore method below
 *
 * @param  {array} rawData (Required) - The raw input data, an array of objects. Each object represents a row of data.
 */
GSyncTable.prototype.createInternalDataStore = function createInternalDataStore(rawData) {
  console.log('Executing createInternalDataStore');
  var headersArray = [], primaryKeyArray, i ,j, header, count, result, ix;
  // verify rawData is non-empty
  if (rawData.length === 0) {
    console.info("Input data is empty");
    this.internalDataStore = {};
    return;
  }
  // loop through each object in the array, to verify type
  for (i = 0; i < rawData.length; i += 1) {
    if (typeof rawData[i] !== "object"){
      throw "Error! Incorrect data format, at least one of the objects in the input array is not an object type.";
    }
    for (ix=0; ix<rawData[i].length; ix+=1) {
      // Add other parsing rules here
      if (rawData[i][ix] === null) {
        rawData[i][ix] = "";
      }
    }
  }
  // loop through each object in the array, to create internalDataStore
  for (i = 0; i < rawData.length; i += 1) {
    primaryKeyArray = [];
    // create a primary keys array
    for (j = 0; j < this.keyColHeaders.length; j += 1) {
      header = rawData[i][this.keyColHeaders[j]];
      if (header === null) {
        var objectNum = (+i) + (+1);
        throw "Error! Object " + objectNum + " in the input array is missing the " + this.keyColHeaders[j] + " key column header";
      }
      primaryKeyArray.push(header);
    }
    this.internalDataStore[primaryKeyArray] = {rawRow: rawData[i],
                                               sheetRow: "",
                                               rowNumber: ""};
    // making an array for all the headers to be passed to this.setHeaders()
    for (var key in rawData[i]) {
      if (rawData[i].hasOwnProperty(key)) {
        // Cannot accept blank column headers as input, might mess things up. if a sheet has a blank header, that column will simply be ignored...
        if (key !== "") {
          headersArray.push(key);
        } else {
          throw "GSheetSync does not accept blank column headers";
        }
      }
    }
  }
  headersArray = this.uniqueArray(headersArray);
  this.setHeaders(headersArray);
  for (i = 0; i < headersArray.length; i += 1) {
    header = headersArray[i];
    this.addUpdateRequest(header, header, this.headersRowNum);
  }
  // Writes any additional headers that were queued for updateing when the addUpdateRequest method was called above
  count = 0;
  do {
    result = this.writeRequests();
    if (result === false) {
      console.log("Sheets API gave an empty responce, re-attempting");
    }
    count += 1;
  }
  while (result === false && count < 3);
  if (result === false) {
    throw "Error! Google Sheets api became unresponsive, try again.";
  }
  console.log('Completed createInternalDataStore');
};

/**
 * @description - Gets all the primary keys from the sheet object, and sorts them into an object that contains other objects.
 *                An example of this object: 
 *                internalDataStore = {["row_n_key1", "row_n_key2",..]    : {"sheetRow": {"header1": "value1", "header2": "value2"...},
 *                                                                           "rawRow"  : {"header2": "updated_value2"},
 *                                                                           "rowNumber": ##},
 *                                     ["row_n+1_key1", "row_n+1_key2",..]: {"sheetRow": ...}
 */
GSyncTable.prototype.updateInternalDataStore = function updateInternalDataStore() {
  console.log('Executing updateInternalDataStore');
  var lastColIx, lastColAlphabet, startRange, a1Range, args, sheetValues, i, j, deleted, ignoreRow;
  
  this.data = [];
  
  // if there are no headers on the sheet, return
  if (this.originalHeaders === false) {
    console.info("Sheet does not appear to contain any column headers. Continuing...");
    return true;
  }

  sheetValues = this.fetchSheetData();

  // If there are no sheet values, means the sheet is empty - note: if we're here it also means there IS a non-empty headers row.
  if (!sheetValues) {
    console.info("Sheet contains column headers but does not have any row data. Continuing...");
    return true;
  }
  // Taking note of the keys already in the data store
  var currentKeys = Object.keys(this.internalDataStore);
  for (i=0; i<sheetValues.length; i++) {
    // looping through each row of the sheet data
    var rowNum = (+i) + (+this.maxReservedRow) + (+1);
    var rowObj = {},
        keyArray = [],
        row = sheetValues[i],
        firstHeaderIx;
    
    // Is the row blank?
    // If a row is deemed blank, it will be completely skipped over in this update process (it will remain as is on the sheet)
    // Verify by checking for the presence of the first key header
    //    - Note: GSheetSync doesn't accept raw data with blank keu cell value(s)
    firstHeaderIx = this.headersToIndex[this.keyColHeaders[0]];
    if (row[firstHeaderIx] === undefined) {
      continue;
    }
    // Looping through the key headers to create a primary key(s) array for this row of data
    for (j = 0; j < this.keyColHeaders.length; j += 1) {
      var headerIx = this.headersToIndex[this.keyColHeaders[j]];
      var keyHeader = row[headerIx];
      if (keyHeader === undefined) {
        ignoreRow = true;
        break;
      } else {
        ignoreRow = false;
      }
      // Removing the deleted tags that may have been previously added by the sync method
      // Reasoning here is that previously unsynchronised data may now be synchronized again, so it should no longer be flagged
      // Sadly no such abilities exist for if rows have been removed/blanked by GSheetSync
      keyHeader = keyHeader.toString();
      // In the sync method, if a 'undelete' parameter was recieved, then these would be carried out here
      if (keyHeader.indexOf(" (DELETED)") != -1) {
        do {
          keyHeader = keyHeader.replace(" (DELETED)", "");
          deleted = (keyHeader.indexOf(" (DELETED)") != -1);
        }
        while (deleted);
      }
      keyArray.push(keyHeader);
    }
    if (ignoreRow === true) {
      continue;
    }
    for (j = 0; j < row.length; j += 1) {
      var header = this.indexToHeaders[j];
      if (header == "") {
        continue;
      }
      rowObj[header] = row[j];
    }
    this.data.push(rowObj);
    // checking if current keyArray exists in the internalDataStore's keys
    if (this.checkArrayInArray(currentKeys, keyArray)) {
      this.internalDataStore[keyArray].sheetRow = rowObj;
      this.internalDataStore[keyArray].rowNumber = rowNum;
    } else {
      this.internalDataStore[keyArray] = {rawRow: "",
                                          sheetRow: rowObj,
                                          rowNumber: rowNum};
    }
  }
  console.log('Completed updateInternalDataStore');
  return true;
};

/**
 * @description - Returns data read directly from the sheet
 *
 * @return {array} - An array of arrays, each array containing cell values for one complete row on a sheet
 */
GSyncTable.prototype.fetchSheetData = function fetchSheetData() {
  var lastColIx, lastColAlphabet, a1Range, startRange, args, sheetValues, range;
  
  range = this.sheetName + "!" + this.headersRowNum + ":" + this.headersRowNum;
  lastColIx = Sheets.Spreadsheets.Values.get(this.spreadsheetId, range, {"majorDimension": "COLUMNS"}).values.length;
  lastColIx -= 1;
  lastColAlphabet = this.indexToAlphabet[lastColIx];
  startRange = "A" + ((+this.maxReservedRow) + (+1));
  a1Range = this.sheetName + "!" + startRange + ":" + lastColAlphabet + this.lastRowNum;
  args = {"majorDimension": "ROWS", "valueRenderOption": "UNFORMATTED_VALUE"};
  try {
    sheetValues = Sheets.Spreadsheets.Values.get(this.spreadsheetId,
                                                 a1Range,
                                                 args).values;
  } catch (err) {
    if (err == "Exception: Empty response") {
      console.log("A Google service call has resulted in an 'Empty Responce' error, attempting to continue...");
      return false;
    } else {
      throw err;
    }
  }
  return sheetValues;
};

/**
 * @description - Parses the data on a sheet into a more manageable data structure.
 *                An array ontaining object literals, column header keys mapped to a row's cell values
 *
 * @return {array} - Array containing object literals
 */
GSyncTable.prototype.readSheetData = function readSheetData() {
  this.updateInternalDataStore();
  if (this.data.length > 0) {
    return this.data;
  } else {
    throw "Unable to read data, sheet may be empty"
  }
}

/**
 * @description - Converts a JSON Object, containing data queried using BigQuery API, into an array of objects (the data type supported by GSheetSync).
 *
 * @param  {object} queryResultsObject (Required) - An Object containing the all the data about the query, including the results of the query.
 * @return {array}                                - An array of objects, each object containing a row of data. This is the data type GSheetSync takes as input.
 */
GSyncTable.prototype.convertBigQueryResults = function convertBigQueryResults(queryResultsObject) {
  console.log('Executing convertBigQueryResults');
  var modifiedArray = [], jobId, projectId, headers, sleepTimeMs, rows, data, i, j;
  
  // Verify argument is a bigquery queryresults object
  if (queryResultsObject.kind !== "bigquery#queryResponse") {
    throw "Error! convertBigQueryResults only takes a BigQuery query object";
  }
  jobId = queryResultsObject.jobReference.jobId;
  projectId = queryResultsObject.jobReference.projectId;
  
  // In case the 'job' is yet incomplete
  sleepTimeMs = 500;
  while (!queryResultsObject.jobComplete) {
    console.info("Query Job is incomplete, re-attempting query");
    Utilities.sleep(sleepTimeMs);
    sleepTimeMs *= 2;
    queryResultsObject = BigQuery.Jobs.getQueryResults(projectId, jobId);
  }
  
  // Note: these headers are in order of being 'selected' in the SQL query
  headers = queryResultsObject.schema.fields.map(function(field) {
    return field.name;
  });
  
  // Get all the rows of data 
  rows = queryResultsObject.rows;
  while (queryResultsObject.pageToken) {
    queryResultsObject = BigQuery.Jobs.getQueryResults(projectId, jobId, {
      pageToken: queryResultsObject.pageToken
    });
    rows = rows.concat(queryResultsObject.rows);
  }
  
  /*
  Below there is an area of inefficiency, as data is changed into an array of arrays, and then into an array
  of objects.I should really be looking into making it an array of objects right off the bat.
  */
  
  // Append the results from the query into an array of arrays.
  data = new Array(rows.length);
  for (i = 0; i < rows.length; i++) {
    var cols = rows[i].f;
    data[i] = new Array(cols.length);
    for (j = 0; j < cols.length; j++) {
      data[i][j] = cols[j].v;
    }
  }
  
  // Write results into an object format, using headers as keys
  for (i = 0; i < data.length; i += 1) {
    var singleRow = data[i],
        rowObject = {};
    for (j = 0; j < singleRow.length; j += 1) {
      if (singleRow[j] === null) {
        singleRow[j] = "";
      }
      rowObject[headers[j]] = singleRow[j];
    }
    modifiedArray.push(rowObject);
  }
  console.info("Big Qeury data has been successfully converted into the appropriate data type for GSheetSync");
  console.log('Completed convertBigQueryResults');
  return modifiedArray;
};

/**
 * @description - Creates an object that houses key value pairs indexed by incremented integers containing corrsponding alphabets
 *
 *              To help visualize, the function returns an object like this:  {0: 'A',
 *                                                                             1: 'B',
 *                                                                             2: 'C',
 *                                                                             ...,
 *                                                                             26:'AA',
 *                                                                             27:'AB',
 *                                                                             ...,
 *
 *                                                                             limit: '..'}
 * @param  {number} limit - (Required) - The number to which the return object should be indexed to
 */
GSyncTable.prototype.createA1Mapping = function createA1Mapping(limit) {
  var indexToAlphabet = {},
      char = "A",
      i = 0;
  while (i <= limit) {
    // need to loop through and produce a list in order a,b,c etc.
    indexToAlphabet[i] = char;
    char = this.nextChar(char);
    i += 1;
  }
  return indexToAlphabet;
};

/**
 * @description - Takes a column index in A1 notation, returns the next column.
 *                this.nextChar('AA') would return AB
 *
 * @param  {string} c (Required) - Column index in A1 notation
 * @return {string}              - Next column index in A1 notation
 */
GSyncTable.prototype.nextChar = function(c) {
  var u = c.toUpperCase();
  if (this.same(u,"Z")){
    var txt = "",
        i = u.length;
    while (i--) {
      txt += "A";
    }
    return (txt+"A");
  } else {
    var p = "",
        q = "";
    if(u.length > 1){
      p = u.substring(0, u.length - 1);
      q = String.fromCharCode(p.slice(-1).charCodeAt(0));
    }
    var l = u.slice(-1).charCodeAt(0),
        z = this.nextLetter(l);
    if(z==="A"){
      return p.slice(0,-1) + this.nextLetter(q.slice(-1).charCodeAt(0)) + z;
    } else {
      return p + z;
    }
  }
};

GSyncTable.prototype.nextLetter = function(l){
  if(l<90){
    return String.fromCharCode(l + 1);
  }
  else{
    return "A";
  }
};

GSyncTable.prototype.same = function(str,char){
  var i = str.length;
  while (i--) {
    if (str[i]!==char){
      return false;
    }
  }
  return true;
};

/**
 * @description - Takes an array and removes any repeated elements, preserves empty strings as they are.
 *                (in setHeaders, if one of more column headers are empty, for whatever reason, we need to preserve that)
 * 
 * @param  {array} arrArg (Required) - An array that may or may not contain duplicate elements
 * @return {array}                   - An array that doesn't contain any repeated elements
 */
GSyncTable.prototype.uniqueArray = function(arrArg) {
  return arrArg.filter(function(elem, pos, arr) {
    if (elem === "") {
      return true;
    } else if(elem !== "") {
      return arr.indexOf(elem) == pos;
    }
  });
};

/**
 * @description - Takes two arrays, and determines if an array contains instances of another.
 *                Eg. if arr = [[1,3], [2,5], [1,4]] and testArray = [2,5], this function would return true.
 *                if testArray is instead [5, 2], the function would return false.
 *
 * @param  {array}   arr        (Required) - The larger array that may or may not contain the testArray
 * @param  {array}   testArray  (Required) - The array to test the existence of, within arr
 * @return {boolean}                       - True if testArray is an element or arr, false if testArray is not an element of arr
 */
GSyncTable.prototype.checkArrayInArray = function checkArrayInArray(arr, testArray){
  var testString = testArray.toString(),
      contains = arr.some(function(ele){
        return ele.toString() === testString;
      });
  return contains;
};

/**
 * @description - For the argument array, creates another array that contains the elements which are repeared
 *                one or more times in the argument array
 *
 * @return {array} - Array containing the repeated elements in the argument array
 */
GSyncTable.prototype.findDuplicatesInArray = function findDuplicatesInArray(data) {
  var result = [];
  data.forEach(function(element, index) {
    // Find if there is a duplicate or not
    if (data.indexOf(element, index + 1) > -1) {
      // Find if the element is already in the result array or not
      if (result.indexOf(element) === -1) {
        result.push(element);
      }
    }
  });
  return result;
};
