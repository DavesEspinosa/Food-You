require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch(err => {
    console.error('Error connecting to mongo', err);
  });

const indexRouter = require('./routes/index.routes');
const authRouter = require('./routes/auth.routes');
const recipesRouter = require('./routes/recipes.routes');
const profileRouter = require('./routes/users.routes')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

hbs.registerPartials(path.join(__dirname, "/views/partials"));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'public', 'images', 'favicon.ico')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: { maxAge: 6000000 }, // una horita poe ejemplo
  store: new MongoStore ({
    mongooseConnection: mongoose.connection,
    ttl:60 * 60 * 24 * 7, 
  })
}));

app.use((req, res, next) => {
  if (req.session.currentUser) {
    //currentUserInfo es la informacion del usuario en la sesion
    res.locals.currentUserInfo = req.session.currentUser;
    //indica que hay un usuario loggeado
    res.locals.isUserLoggedIn = true;
  } else {
    res.locals.isUserLoggedIn = false;
  }
  next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', recipesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
