const { verifyUserEmailsFromFileOfEmails } = require('../utils/utils');

const execute = () => {
    const filePath = process.argv ? process.argv[2] : undefined;

    verifyUserEmailsFromFileOfEmails(filePath)
    .then(emails => {
        console.log('Emails verified: ', JSON.stringify(emails.verifiedEmails, null, 2));
        console.log('Emails skipped: ', JSON.stringify(emails.skippedEmails, null, 2));
        console.log('Emails failed verification: ', JSON.stringify(emails.failedEmails, null, 2));
    })
    .catch(e => console.error(e));
}

execute();