const { verifyUserEmailsFromFileOfUsernames } = require('../utils/utils');

const execute = () => {
    const filePath = process.argv ? process.argv[2] : undefined;

    verifyUserEmailsFromFileOfUsernames(filePath)
    .then(usernames => {
        console.log('Usernames which emails verified: ', JSON.stringify(usernames.verifiedUsernames, null, 2));
        console.log('Usernames which emails skipped: ', JSON.stringify(usernames.skippedUsernames, null, 2));
        console.log('Usernames which emails failed verification: ', JSON.stringify(usernames.failedUsernames, null, 2));
    })
    .catch(e => console.error(e));
}

execute();