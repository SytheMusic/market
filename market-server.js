// Generated by CoffeeScript 1.10.0
var start;

start = function(ready) {
  var async, config, conn, connectToDatabase, createDirectories, getLogger, logger, models, startWebApp, utilities;
  async = require('async');
  config = require('./server-config.json');
  getLogger = function(name, level) {
    var log4js, logger, path;
    log4js = require('log4js');
    path = require('path');
    log4js.configure({
      appenders: [
        {
          type: 'console'
        }, {
          type: 'file',
          filename: 'logs' + path.sep + config.logger.filename,
          category: name
        }
      ]
    });
    logger = log4js.getLogger(name);
    logger.setLevel(level);
    return logger;
  };
  logger = getLogger('market-server', config.logger.level);
  conn = {};
  models = {};
  utilities = {
    checkIsAdmin: function(bankid) {
      var admins;
      admins = config.admins;
      if ((admins.indexOf(bankid)) > -1) {
        return true;
      }
      return false;
    },
    checkMoneySource: function(bankid) {
      var sources;
      sources = config.money_source;
      if ((sources.indexOf(bankid)) > -1) {
        return true;
      }
      return false;
    },
    checkMoneyVoid: function(bankid) {
      var voids;
      voids = config.money_void;
      if ((voids.indexOf(bankid)) > -1) {
        return true;
      }
      return false;
    },
    displayUser: function(username, bankid) {
      return username + ' (#' + bankid + ')';
    }
  };
  createDirectories = function(callback) {
    var createDirectory, fs, required_directories;
    fs = require('fs-extra');
    required_directories = ['user-content/item-images'];
    createDirectory = function(directory, callback) {
      return fs.ensureDir(directory, function(err) {
        if (err != null) {
          logger.error(err);
        }
        return callback();
      });
    };
    return async.each(required_directories, createDirectory, function() {
      logger.info('Created required directories');
      return callback();
    });
  };
  connectToDatabase = function(callback) {
    var Schema, database_url, mongoose, schemas, setModels, setSchemas;
    mongoose = require('mongoose');
    Schema = mongoose.Schema;
    conn = mongoose.connection;
    schemas = {};
    setSchemas = function() {
      schemas.items = new Schema({
        id: String,
        owner: String,
        name: String,
        price: Number,
        quantity: Number,
        instructions: Number,
        image: String,
        forSale: Boolean,
        quicklink: String
      }, {
        collection: 'items'
      });
      schemas.transactions = new Schema({
        from: String,
        to: String,
        date: Date,
        amount: Number,
        memo: String,
        generated: Boolean
      }, {
        collection: 'transactions'
      });
      schemas.users = new Schema({
        id: String,
        username: String,
        username_lower: String,
        bankid: String,
        password: String,
        balance: Number,
        tagline: String,
        trusted: Boolean,
        taxExempt: Boolean
      }, {
        collection: 'users'
      });
      schemas.quicklinks = new Schema({
        link: String,
        item: String,
        payment: {
          to: String,
          amount: Number,
          memo: String
        }
      }, {
        collection: 'quicklinks'
      });
      return schemas.receipts = new Schema({
        id: String,
        proof: String,
        buyer: String,
        seller: String,
        recipient: String,
        date: Date,
        items: {
          name: String,
          quantity: Number,
          description: String,
          instructions: String
        }
      }, {
        collection: 'receipts'
      });
    };
    setSchemas();
    setModels = function() {
      models.users = mongoose.model('user', schemas.users);
      models.items = mongoose.model('items', schemas.items);
      models.transactions = mongoose.model('transactions', schemas.transactions);
      models.quicklinks = mongoose.model('quicklinks', schemas.quicklinks);
      return models.receipts = mongoose.model('receipts', schemas.receipts);
    };
    setModels();
    database_url = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database;
    logger.debug('Connecting to database ' + database_url);
    mongoose.connect(database_url);
    conn.once('error', function(err) {
      callback(err);
      throw err;
    });
    return conn.once('open', function() {
      logger.info('Successfully connected to database');
      return callback();
    });
  };
  startWebApp = function(callback) {
    var app, configureExpress, express, passwordHasher, startWebServer;
    express = require('express');
    app = express();
    passwordHasher = require('password-hash-and-salt');
    configureExpress = function(callback) {
      var LocalStrategy, bodyParser, fieldSelector, flash, passport, session;
      session = require('express-session');
      app.use(session({
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: false
      }));
      passport = require('passport');
      LocalStrategy = require('passport-local').Strategy;
      passport.use(new LocalStrategy({
        passReqToCallback: true
      }, function(req, username, password, done) {
        var getUser, loginFail, user, verifyPassword;
        username = username.toLowerCase();
        user = {};
        loginFail = function() {
          logger.info(username + ' failed to log in');
          return done(null, false, {
            message: 'Incorrect username or password'
          });
        };
        getUser = function(callback) {
          if (username.substring(0, 1 === '#')) {
            return models.users.findOne({
              bankid: username.substring(1)
            }, function(err, found_user) {
              if (err != null) {
                logger.error(err);
                return callback(err);
              } else {
                user = found_user;
                return callback();
              }
            });
          } else {
            return models.users.findOne({
              username_lower: username.toLowerCase()
            }, function(err, found_user) {
              if (err != null) {
                logger.error(err);
                loginFail();
                return callback(err);
              } else {
                if (found_user) {
                  user = found_user;
                  return callback();
                } else {
                  loginFail();
                  return callback('failed to log in');
                }
              }
            });
          }
        };
        verifyPassword = function(callback) {
          return passwordHasher(password).verifyAgainst(user.password, function(err, verified) {
            if (err != null) {
              logger.error(err);
              loginFail();
              return callback(err);
            } else {
              if (verified) {
                logger.info(username + ' successfully logged in');
                done(null, user);
                return callback();
              } else {
                loginFail();
                return callback('failed to login');
              }
            }
          });
        };
        return async.series([getUser, verifyPassword]);
      }));
      passport.serializeUser(function(user, done) {
        return done(null, user.id);
      });
      passport.deserializeUser(function(id, done) {
        return models.users.findOne({
          id: id
        }, function(err, user) {
          return done(err, user);
        });
      });
      app.use(passport.initialize());
      app.use(passport.session());
      bodyParser = require('body-parser');
      app.use(bodyParser.json({
        limit: '5mb'
      }));
      app.use(bodyParser.urlencoded({
        limit: '5mb',
        extended: true
      }));
      flash = require('connect-flash');
      app.use(flash());
      fieldSelector = require('./field-selector');
      session = require('express-session');
      app.use(session({
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: false
      }));
      app.use('/static', express["static"]('webcontent'));
      app.get('/api/config', function(req, res) {
        res.set('Content-Type', 'text/json');
        return res.send(fieldSelector.selectWithQueryString(req.query.fields, {
          title: config.page_text.title,
          footer: config.page_text.footer,
          captcha_site_key: config.captcha.site_key
        }));
      });
      app.post('/api/signin', passport.authenticate('local', {
        successRedirect: '/#/profile',
        failureRedirect: '/signin',
        failureFlash: false
      }));
      app.post('/api/createaccount', function(req, res) {
        var createAccount, respond, verifyCaptcha;
        respond = function(status) {
          if (status.success) {
            logger.info(req.ip + ' created a new account');
            return res.send({
              success: true
            });
          } else {
            return res.send({
              success: false,
              message: status.message
            });
          }
        };
        verifyCaptcha = function(callback) {
          var recaptcha_response, request;
          if (!config.captcha.enabled) {
            return callback();
          } else {
            request = require('request');
            recaptcha_response = req.body['g-recaptcha-response'];
            return request.post('https://www.google.com/recaptcha/api/siteverify', {
              form: {
                secret: config.captcha.secret_key,
                response: recaptcha_response
              }
            }, function(err, res, body) {
              body = JSON.parse(body);
              if (body.success) {
                return callback();
              } else {
                respond({
                  success: false,
                  message: 'Could not verify captcha'
                });
                return callback('Could not verify captcha');
              }
            });
          }
        };
        createAccount = function(callback) {
          var addAccount, hashPassword, hashed_password;
          hashed_password = '';
          hashPassword = function(callback) {
            return passwordHasher(req.body['password']).hash(function(err, hash) {
              if (err != null) {
                return callback(err);
              } else {
                hashed_password = hash;
                return callback();
              }
            });
          };
          addAccount = function(callback) {};
          return async.series([hashPassword], callback);
        };
        return async.series([verifyCaptcha, createAccount]);
      });
      app.post('/api/items', function(req, res) {
        var limit, skip;
        res.set('Content-Type', 'text/json');
        if (req.user != null) {
          limit = req.query.limit != null ? parseInt(req.qurey.limit) : null;
          skip = req.query.skip != null ? parseInt(req.query.skip) : 0;
          return models.items.find({
            owner: req.user.id
          }).skip(skip).limit(limit).lean().exec(function(err, data) {
            if (data != null) {
              return res.send(data);
            } else {
              return res.send([]);
            }
          });
        } else {
          return res.send(null);
        }
      });
      app.get('/api/user', function(req, res) {
        var taxRate;
        res.set('Content-Type', 'text/json');
        if (req.user != null) {
          taxRate = config.tax.rate;
          if (req.user.taxExempt) {
            taxRate = 0;
          }
          return res.send(fieldSelector.selectWithQueryString(req.query.fields, {
            username: req.user.username,
            bankid: req.user.bankid,
            balance: req.user.balance / 100,
            tagline: req.user.tagline,
            taxRate: taxRate,
            isAdmin: utilities.checkIsAdmin(req.user.bankid),
            trusted: req.user.trusted,
            taxExempt: req.user.taxExempt,
            isMoneySource: utilities.checkMoneySource(req.user.bankid),
            isMoneyVoid: utilities.checkMoneyVoid(req.user.bankid)
          }));
        } else {
          return res.send(null);
        }
      });
      app.get('/api/users', function(req, res) {
        var limit, skip;
        res.set('Content-Type', 'text/json');
        limit = req.query.limit != null ? parseInt(req.qurey.limit) : null;
        skip = req.query.skip != null ? parseInt(req.query.skip) : 0;
        return models.users.find({}).sort({
          balance: -1
        }).skip(skip).limit(limit).select('id username bankid tagline balance trusted taxExempt').lean().exec(function(err, data) {
          var i, len, user;
          if (data != null) {
            for (i = 0, len = data.length; i < len; i++) {
              user = data[i];
              user.balance = user.balance / 100;
            }
            return res.send(data);
          } else {
            return res.send([]);
          }
        });
      });
      app.get('/signin', function(req, res) {
        if (req.user == null) {
          return res.render('signin.jade', {
            message: req.flash('error'),
            title: config.page_text.title,
            footer: config.page_text.footer
          });
        } else {
          return res.redirect('/');
        }
      });
      app.get('/signout', function(req, res) {
        if (req.user != null) {
          logger.info(utilities.displayUser(req.user.username, req.user.bankid) + ' signed out from ' + req.ip);
          req.logout();
        }
        return res.redirect('/signin');
      });
      app.get('/createaccount', function(req, res) {
        var captchadisplay, captchakey;
        if (req.user == null) {
          captchadisplay = config.captcha.enabled ? 'inline' : 'none';
          captchakey = config.captcha.site_key ? config.captcha_site_key : 'none';
          return res.render('createaccount.jade', {
            message: req.flash('message'),
            username: req.flash('username'),
            bankid: req.flash('bankid'),
            captchadisplay: captchadisplay,
            captchakey: captchakey,
            title: config.page_text.title,
            footer: config.page_text.footer
          });
        } else {
          return res.redirect('/');
        }
      });
      app.get('/', function(req, res) {
        if (req.user != null) {
          return res.render('index.jade');
        } else {
          return res.redirect('/signin');
        }
      });
      app.get('/jade/:name', function(req, res) {
        if (req.user != null) {
          return res.render(req.params.name, {
            title: config.page_text.title,
            bankid: req.user.bankid
          });
        } else {
          return res.redirect('/signin');
        }
      });
      return callback();
    };
    startWebServer = function(callback) {
      var fs, https_options, logReadyMessage, startHttpServer, startHttpolyglotServer, startHttpsServer;
      logReadyMessage = function(port, protocol) {
        return logger.info('Server listening on port ' + port + ' (' + protocol + ')');
      };
      startHttpServer = function(callback) {
        var http, http_server;
        http = require('http');
        http_server = http.createServer(app);
        return http_server.listen(config.port.http, function() {
          logReadyMessage(config.port.http, 'http');
          return callback();
        });
      };
      if (config.https.enabled) {
        fs = require('fs');
        https_options = {
          key: fs.readFileSync(config.https.key),
          cert: fs.readFileSync(config.https.cert),
          ciphers: 'HIGH'
        };
        startHttpsServer = function(callback) {
          var https, https_server;
          https = require('https');
          https_server = https.createServer(https_options, app);
          return https_server.listen(config.port.https, function() {
            logReadyMessage(config.port.https, 'https');
            return callback();
          });
        };
        startHttpolyglotServer = function(callback) {
          var httpolyglot, httpolyglot_server;
          httpolyglot = require('httpolyglot');
          httpolyglot_server = httpolyglot.createServer(https_options, app);
          return httpolyglot_server.listen(config.port.https, function() {
            logReadyMessage(config.port.http, 'http');
            logReadyMessage(config.port.https, 'https');
            return callback();
          });
        };
        if (config.port.http === config.port.https) {
          return async.parallel([startHttpolyglotServer], callback);
        } else {
          return async.parallel([startHttpServer, startHttpServer], callback);
        }
      } else {
        return async.parallel([startHttpServer], callback);
      }
    };
    return async.series([configureExpress, startWebServer], callback);
  };
  return async.series([
    createDirectories, connectToDatabase, startWebApp, function(callback) {
      logger.info('Server startup complete');
      return callback();
    }
  ], ready);
};

module.exports.start = start;
