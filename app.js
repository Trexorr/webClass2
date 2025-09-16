// Variables / Constants
var express = require('express');
var app = express();
var session = require('express-session');
var conn = require('./dbConfig');
const bcrypt = require('bcrypt'); 
const saltRounds = 10;            

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
    res.render('login.ejs', { error: null });
});
app.post('/auth', function (req, res){
    var name = req.body.username;
    var password = req.body.password;
    if (!name || !password) {
        return res.render('login.ejs', { error: 'Login not successful' });
    }
    conn.query('SELECT * FROM users WHERE name = ?', [name], function (error, results) {
        if (error) throw error;
        if (!results || results.length === 0) {
            return res.render('login.ejs', { error: 'Login not successful' });
        }
        var user = results[0];
        bcrypt.compare(password, user.password, function(err, match) {
            if (err || !match) {
                return res.render('login.ejs', { error: 'Login not successful' });
            }
            req.session.loggedin = true;
            req.session.username = name;
            if (name === 'Admin') {
                req.session.isAdmin = true;
            return res.redirect('/admin');
            }
            return res.redirect('/membersOnly');
        });
    });
});

// Register new users
app.post('/register', function (req, res, next){
    var name = req.body.username;
    var password = req.body.password;
    if (!name || !password) {
        return res.render('register', { error: 'Please fill in all the fields' });
    } else {
        conn.query('SELECT * FROM users WHERE name = ?', [name], function (error, results) {
            if (error) throw error;
            if (results && results.length > 0) {
                return res.render('register', { error: 'Username already taken' });
            }
        });
    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            return res.render('register', { error: 'Registration not successful' });
        }
        var sql = `INSERT INTO users (name, password) VALUES ("${name}", "${hash}")`;
        conn.query(sql, function (err2) {
            if (err2) {
                console.log('Registration error');
                return res.render('register', { error: 'Registration not successful' });
            }
            console.log("User registered successfully");
            res.render('login', { error: null, success: 'Registration successful. Please log in.' });
        });
    });
}});

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
    var name = req.body.name;
    var party = req.body.party;
    var sql = `INSERT INTO mps (name, party) VALUES ("${name}", "${party}")`;
    conn.query(sql, function (err, results) {
        if (err) throw err;
        console.log("MP added successfully");
        res.render('addMPs');
    });
});

app.post('/admin/delete', function (req, res) {
    var id = req.body.id;
    var sql = 'DELETE FROM users WHERE id = ?';
    conn.query(sql, [id], function (err, results) {
        if (err) {
            console.log('Error deleting user:', err);
        }
        console.log("User deleted successfully");
        res.redirect('/admin');
    });
});

app.get('/listMPs', function (req, res){
    conn.query('SELECT * FROM MPs', function (err, results,) {
        if (err) throw err;
        res.render('listMPs', { title: 'List of NZ MPs', MPsData: results });
    });
});

app.get('/admin', function (req, res){
    if (!req.session.isAdmin) {
        return res.render('login', { error: 'ACCESS DENIED: Not logged in as admin' });
    }
    conn.query('SELECT * FROM users', function (err, results,) {
        if (err) throw err;
        res.render('admin', { title: 'List of Users', usersData: results });
    });
});

// products page for when we want admin access only
// app.get('/products', function (req, res){
//     if (!req.session.isAdmin) {
//         return res.render('login', { error: 'ACCESS DENIED: Not logged in' });
//     }
//     conn.query('SELECT * FROM users', function (err, results,) {
//         if (err) throw err;
//         res.render('admin', { title: 'List of Users', usersData: results });
//     });
// });

app.get('/products', function (req, res){
    conn.query('SELECT * FROM products', function (err, results,) {
        if (err) throw err;
        res.render('products', { title: 'List of Products', products: results });
    });
});

app.post('/products/rating', function (req, res) {
    var newRating = req.body.productRating;
    var productId = req.body.productId;
    var sql = 'UPDATE products SET rating = ? WHERE id = ?';
    conn.query(sql, [newRating, productId], function (err, results) {
        if (err) {
            console.log('Error updating product rating:', err);
        }
        console.log("Rating Updated successfully");
        res.redirect('/products');
    });
});

app.post('/products/newProduct', function (req, res) {
    var name = req.body.productName;
    var price = req.body.productPrice;
    var minRating = "1"
    var sql = `INSERT INTO products (name, pricing, rating) VALUES ("${name}", "${price}", "${minRating}")`;
    conn.query(sql, function (err, results) {
        if (err) throw err;
        console.log("Product added successfully");
        res.redirect('/products');
    });
});

app.get('/register', function (req, res){
    res.render('register');
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
    res.render("nzpost-confirmation");
});

app.listen(4000);
console.log('Node app is running on port 3000');