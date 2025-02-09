const path = require('path');
const programDir = path.join(__dirname, 'programs', 'splerg-p2p');
const idlDir = path.join(__dirname, 'sdk',  'idl');
const sdkDir = path.join(__dirname, 'sdk', 'generated');
const binaryInstallDir = path.join(__dirname, '.crates');

module.exports = {
  idlGenerator: 'shank',
  programName: 'splerg_p2p',
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};