var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var userSchema = new mongoose.Schema ({
    username: {type: String, unique: true},
    password: {type: String, unique: true},
    firstname: String,
    lastname: String,
    myList: []

});

var User = mongoose.model('myuser', userSchema);

module.exports = User;