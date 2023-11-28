// Replace 'YOUR_FOLDER_ID' with the actual ID of the folder you want to monitor
var folderId = 'YOUR_FOLDER_ID';

// Replace 'YOUR_EMAIL_ADDRESS' with the email address where you want to receive notifications
var emailAddresses = ['YOUR_EMAIL_ADDRESS_1', 'YOUR_EMAIL_ADDRESS_2'];

// Script information for tracking last execution time
var scriptInfo = {
  checkForNewFiles: {
    lastRunTime: 0,
    scriptName: 'checkForNewFiles'
  }
};

function createDriveAppTrigger() {
  // Trigger the checkForNewFiles function every 5 minutes
  ScriptApp.newTrigger('checkForNewFiles')
    .timeBased()
    .everyMinutes(5)
    .create();
}

function checkForNewFiles() {
  console.log('Script started...');

  var folder = DriveApp.getFolderById(folderId);
  console.log('Folder ID:', folder.getId());

  // Process the folder only if the script has not run within the last minute
  var currentTime = new Date().getTime();
  var lastRunTime = scriptInfo.checkForNewFiles.lastRunTime;

  if (currentTime - lastRunTime >= 60000) {
    processFolder(folder, scriptInfo.checkForNewFiles.scriptName);

    // Update the last run time for the script
    scriptInfo.checkForNewFiles.lastRunTime = currentTime;
  } else {
    console.log('Script already run within the last minute. Skipping...');
  }

  console.log('Script finished...');

  // Schedule the next execution 5 minutes later
  ScriptApp.newTrigger('checkForNewFiles')
    .timeBased()
    .at(new Date(currentTime + 5 * 60 * 1000))
    .create();
}

function processFolder(folder, scriptName) {
  var files = folder.getFiles();

  while (files.hasNext()) {
    var file = files.next();
    var fileId = file.getId();

    // Check if the file was already processed
    if (!isFileProcessed(fileId)) {
      var lastModified = file.getLastUpdated();

      // Check if the file was created in the last 5 minutes
      var currentTime = new Date();
      var fiveMinutesAgo = new Date(currentTime.getTime() - 5 * 60 * 1000);

      if (file.getDateCreated() > fiveMinutesAgo) {
        // Log information about the file
        console.log('File Found - Name:', file.getName(), 'URL:', file.getUrl());

        // Send email notification with script name
        sendEmailNotification(file.getName(), file.getUrl(), scriptName);

        // Add the file ID to the processed list to avoid duplicate notifications
        markFileAsProcessed(fileId);
      }
    }
  }

  // Recursively process subfolders
  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    processFolder(subfolders.next(), scriptName);
  }
}

function sendEmailNotification(fileName, fileUrl, scriptName) {
  var subject = 'File Upload Notification - IBCF Sermon Google Folders' + fileName;
  var body = 'A new video has been uploaded:\n\n' +
    'File Name: ' + fileName + '\n' +
    'File URL: ' + fileUrl + '\n\n\n' +
    'Thank You';

  // Send email
  MailApp.sendEmail(emailAddress, subject, body);
}

function markFileAsProcessed(fileId) {
  // Store the file ID as processed
  var processedFiles = getProcessedFiles();
  processedFiles[fileId] = true;
  PropertiesService.getScriptProperties().setProperty('processedFiles', JSON.stringify(processedFiles));
}

function isFileProcessed(fileId) {
  // Check if the file ID is marked as processed
  var processedFiles = getProcessedFiles();
  return processedFiles[fileId] || false;
}

function getProcessedFiles() {
  // Retrieve the processed files from the PropertiesService
  var processedFilesString = PropertiesService.getScriptProperties().getProperty('processedFiles') || '{}';
  return JSON.parse(processedFilesString);
}

function doGet(e) {
  return HtmlService.createHtmlOutput('Script is deployed as a web app. It does not have a user interface. Please contact the administrator for any issues.');
}

