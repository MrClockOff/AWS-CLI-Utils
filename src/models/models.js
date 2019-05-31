class UserModel {
    constructor(username, emailVerified) {
        this.username = username;
        this.emailVerified = emailVerified;
    }
}

class UsersPageModel {
    constructor(users, nextPageToken) {
        this.users = users;
        this.nextPageToken = nextPageToken;
    }
}

module.exports = {
    UserModel,
    UsersPageModel
}