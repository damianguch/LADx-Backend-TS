const fs = require('fs');
const path = require('path');

// Function to create logs
async function createAppLog(data) {
  const parentFolderPath = 'logs';
  const today = new Date();
  const formattedDate = today.toISOString().slice(0, 10);

  const folderPath = path.join(parentFolderPath, formattedDate);

  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating folder:', err);
    } else {
      // Create the log file inside the folder
      const logFilePath = path.join(folderPath, 'log.txt');
      const logData = `Time logged: (${today.toLocaleTimeString()}):-  Message: ${data}\n`;

      fs.appendFile(logFilePath, logData, { flag: 'a' }, (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        } else {
          //console.log('Log file written successfully:', logFilePath);
        }
      });
    }
  });
}

module.exports = {
  createAppLog
};
