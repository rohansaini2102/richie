const fs = require('fs');
const path = require('path');

/**
 * Create required directories for file uploads
 */
const createRequiredDirectories = () => {
  const directories = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/cas'),
    path.join(__dirname, '../uploads/kyc'),
    path.join(__dirname, '../uploads/temp')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

module.exports = { createRequiredDirectories }; 