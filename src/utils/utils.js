const AwsCli = require('aws-cli-js');
const csv = require('csv-parse');
const fs = require('fs');
const { UserModel, UsersPageModel } = require('../models/models');

/**
 * Get Aws CLI instance
 */
const getAwsCli = () => {
    const options = new AwsCli.Options(
        process.env.AWS_ACCESS_KEY,
        process.env.AWS_SECRET_KEY
    );
    const aws = new AwsCli.Aws(options); 

    return aws;
}
/******************************************* */

/**
 * Get all users which have unverified emils
 */
const awsDataToUsers = (data) => {
    return data.object.Users.map(u => {
        const emailVerifiedAttribute = u.Attributes.find(a => a.Name === 'email_verified') || {};
        const emailVerified = emailVerifiedAttribute.Value === 'true';
        return new UserModel(u.Username, emailVerified);
    });
};

const findUnverifiedUsers = (data) => {
    const users = awsDataToUsers(data);
    
    let unverifiedUsers = []; 
    
    users.forEach(u => {
        if (!u.emailVerified) {
            unverifiedUsers.push(u);
        }
    });

    return unverifiedUsers;
}

const getNextUnverifiedUsersPage = async (aws, paginationToken) => {
    const paginationParam = paginationToken ? `--pagination-token ${paginationToken}` : '';
    const userPoolId = `--user-pool-id ${process.env.AWS_COGNITO_USER_POOL_ID}`;
    const filter = '--filter "username ^= \\"Cognito_\\""'
    const command = `cognito-idp list-users ${userPoolId} ${filter} ${paginationParam}`;
    const data = await aws.command(command);

    if (data.error) {
        throw new Error(data.error);
    }

    const unverifiedUsers = findUnverifiedUsers(data);
    
    return new UsersPageModel(unverifiedUsers, data.object.PaginationToken);
}

const getAllUnverifiedUsers = async () => {
    let nextPage = true;
    let paginationToken;
    const users = [];
    const aws = getAwsCli();

    while(nextPage) {
        const result = await getNextUnverifiedUsersPage(aws, paginationToken);
        users.push(...result.users);
        paginationToken = result.nextPageToken;
        nextPage = paginationToken !== undefined;
    }

    return users;
}
/******************************************* */

/**
 * Verify user email
 */
const verifyUserEmail = async ({email, username}) => {
    const aws = getAwsCli();
    let user; 
    
    if (email) {
        user = await findUserByEmail(aws, email);
    } else {
        user = await findUserByUsername(aws, username);
    }
    
    const emailVerifiedAttribute = user.UserAttributes.find(a => a.Name === 'email_verified') || {};

    if (emailVerifiedAttribute.Value === 'true') {
        return {
            message: 'User is already verified!',
            user
        };
    }

    await updateEmailVerifiedAttribute(aws, user);

    return user;
}

const findUserByEmail = async (aws, email) => {
    if (!email) {
        throw new Error('Email parameter is required!');
    }

    // Find user
    const username = `Cognito_${email.toLowerCase().replace('@', '-')}`;
    const result = await findUserByUsername(aws, username);

    return result;
}

const findUserByUsername = async (aws, username) => {
    if (!username) {
        throw new Error('Username parameter is required!');
    }

    // Find user
    const cognitoUsername = `--username ${username}`;
    const userPoolId = `--user-pool-id ${process.env.AWS_COGNITO_USER_POOL_ID}`;
    const findCommand = `cognito-idp admin-get-user ${userPoolId} ${cognitoUsername}`
    const result = await aws.command(findCommand);

    if (result.error) {
        throw new Error(user.error);
    }

    return result.object;
}

const updateEmailVerifiedAttribute = async (aws, user) => {
    // Update user
    const username = `--username ${user.Username}`;
    const userPoolId = `--user-pool-id ${process.env.AWS_COGNITO_USER_POOL_ID}`;
    const updateCommand = `cognito-idp admin-update-user-attributes ${userPoolId} ${username} --user-attributes Name="email_verified",Value="true"`;
    const result = await aws.command(updateCommand);

    if (result.error) {
        throw new Error(user.error);
    }

    return result.object;
}
/******************************************* */

/**
 * Verify list of emails from CSV file of emails
 */
const verifyUserEmailsFromFileOfEmails = async (filePath) => {
    const emails = await csvToArray(filePath);
    const verifiedEmails = [];
    const skippedEmails = [];
    const failedEmails = [];

    while(emails.length) {
        const email = emails.pop();
        console.log('Verifying email: ', email);

        try {
            const user = await verifyUserEmail({email});

            if (user.message) {
                console.log('Email already verified: ', email);
                skippedEmails.push(email);    
            } else {
                console.log('Email verified: ', email);
                verifiedEmails.push(email);
            }
        } catch (e) {
            console.log('Verification failed for email: ', email);
            failedEmails.push(email);
        }
    }
    
    return {verifiedEmails, skippedEmails, failedEmails};
}

const csvToArray = async (filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const emails = [];
            
            fs
            .createReadStream(filePath)
            .pipe(csv({
                from_line: 2
            }))
            .on('data', data => emails.push(data[0]))
            .on('end', () => resolve(emails));
        } catch (e) {
            reject(e);
        }
    });
}
/******************************************* */

/**
 * Verify list of emails from CSV file of usernames
 */
const verifyUserEmailsFromFileOfUsernames = async (filePath) => {
    const usernames = await csvToArray(filePath);
    const verifiedUsernames = [];
    const skippedUsernames = [];
    const failedUsernames = [];

    while(usernames.length) {
        const username = usernames.pop();
        console.log('Verifying username: ', username);

        try {
            const user = await verifyUserEmail({username});

            if (user.message) {
                console.log('Username has email already verified: ', username);
                skippedUsernames.push(username);    
            } else {
                console.log('Username email verified: ', username);
                verifiedUsernames.push(username);
            }
        } catch (e) {
            console.log('Verification failed for username email: ', username);
            failedUsernames.push(username);
        }
    }
    
    return {verifiedUsernames, skippedUsernames, failedUsernames};
}
/******************************************* */

module.exports = {
    getAllUnverifiedUsers,
    verifyUserEmail,
    verifyUserEmailsFromFileOfEmails,
    verifyUserEmailsFromFileOfUsernames
}