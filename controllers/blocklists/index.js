const local_blocklist = require('./local');
const phishing_army = require('./phishing-army');

const blocklist = [].concat(local_blocklist, phishing_army);

module.exports = blocklist;
