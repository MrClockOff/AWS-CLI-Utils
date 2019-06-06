const { verifyUserEmail } = require('../utils/utils');

const execute = () => {
    const email = process.argv ? process.argv[2] : undefined;

    verifyUserEmail({email})
    .then(user => console.log('User verified: ', JSON.stringify(user, null, 2)))
    .catch(e => console.error(e));
}

execute();