const { getAllUnverifiedUsers } = require('../utils/utils');

const execute = () => {
    getAllUnverifiedUsers()
    .then(r => {
        console.log(r);

        if(r) {
            console.log(r.length);
        }
    })
    .catch(e => console.error(e));
}

execute();