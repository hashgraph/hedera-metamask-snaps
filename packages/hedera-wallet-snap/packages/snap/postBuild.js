/* eslint-disable */
const fs = require('fs');
const pathUtils = require('path');

const bundlePath = pathUtils.join('dist', 'snap.js');
console.log('Bundle path', bundlePath);

let bundleString = fs.readFileSync(bundlePath, 'utf8');

// Perform some post-processing here if needed

fs.writeFileSync(bundlePath, bundleString);
