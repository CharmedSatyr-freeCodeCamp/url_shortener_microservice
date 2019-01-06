const local_blocklist = require('./local.blocklist');
const phishing_army = require('./phishing-army.blocklist');

const blocklist = [].concat(local_blocklist, phishing_army);

module.exports = blocklist;
