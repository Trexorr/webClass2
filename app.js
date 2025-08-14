// Variables / Constants
var express = require('express');
var app = express();
var session = require('express-session');
var conn = require('./dbconfig');

// AppCore
app.use(session({
    secret: 'yoursecret',
    resave: true,
    saveUninitialized: true,
}));
app.set('view engine','ejs');
app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', function (req, res){
res.render("home");
});
app.get('/login', function (req, res){
    res.render("login.ejs");
});
app.post('/auth', function (req, res){
    let name = req.body.username;
    let password = req.body.password;
    if (name && password) {
        conn.query('SELECT * FROM users WHERE name = ? AND password = ?', [name, password], 
        function (error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = name;
                res.redirect('/membersOnly');
            } else {
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    } else {
        res.send('Please enter Username and Password!');
        res.end();
    }
});
app.get('/membersOnly', function (req, res, next){
    if (req.session.loggedin) {
        res.render('membersOnly');
    } else {
        res.send('Please login to view this page!');
    }
});

app.get('/addMPs', function (req, res){
    if (req.session.loggedin) {
        res.render('addMPs');
    } else {
        res.send('Please login to view this page!');
    }
});
app.post('/addMPs', function (req, res, next){
    var id = req.body.id;
    var name = req.body.name;
    var party = req.body.party;
    var sql = `INSERT INTO mps (id, name, party) VALUES ("${id}", "${name}", "${party}")`;
    conn.query(sql, function (err, results) {
        if (err) throw err;
        console.log("MP added successfully");
        res.render('addMPs');
    });
});

app.get('/listMPs', function (req, res){
    conn.query('SELECT * FROM MPs', function (err, results,) {
        if (err) throw err;
        res.render('listMPs', { title: 'List of NZ MPs', MPsData: results });
    });
});

app.get('/auckland', function (req, res){
    res.render("auckland");
});
app.get('/beaches', function (req, res){
    res.render("beaches");
});
app.get('/logout', function (req, res){
    req.session.destroy();
    res.redirect('/');
});
app.get('/nzpost', function (req, res){
    res.render("nzpost");
});
app.post('/feedback', function (req, res){
    // Here you could process the feedback data if needed
    // For now, we'll just redirect to the confirmation page
    res.render("nzpost-confirmation");
});
// DevServer
app.listen(3000);
console.log('Node app is running on port 3000');