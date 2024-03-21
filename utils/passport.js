import session from 'express-session';
import cookiParser from 'cookie-parser';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../db/models/User.js'
import { comparePasswords } from './cipher-service.js';
import MongoStore from 'connect-mongo';

export default (app) => {
  // session basic setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        autoRemove: 'interval',
        autoRemoveInterval: 60, // In every 60 minutes it'll remove expired sessions
        touchAfter: 3600, // time period in seconds
        // Every time request made on server it'll resave all session to avoid it use touchAfter
        // it'll only update session one time in defined interval
      }),
      // automatically extends the session age on each request. useful if you want
      // the user's activity to extend their session. If you want an absolute session
      // expiration, set to false
      rolling: true,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        // sameSite: 'none',
        // secure: true,
        /* this is for https sites, only allow in production 
         can be done environment specific by following snippet
         if (app.get('env') === 'production') {
          app.set('trust proxy', 1) // trust first proxy
          sess.cookie.secure = true // serve secure cookies
        }
        */

        // domain: '',
      },
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((user_id, done) => {
    User.findById(user_id)
      .then(user => {
        done(null, user);
      })
      .catch(err => done(err));
  });

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
    }, async (username, password, done) => {
      const errorMsg = 'Invalid email or password';
      const user = await User.findOne({ email: username });

      if (!user) {
        return done(null, false, { message: errorMsg });
      }
      const isMatch = await comparePasswords(password, user.password);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: errorMsg });
      }
    })
  );

  const getUser = (profile) => {
    const user = {
      userProviderId: profile.id,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      provider: profile.provider,
      role: 'user',
    };
    if (profile.hasOwnProperty('emails') && profile.emails?.length) {
      user.email = profile.emails[0].value;
    }
    return user;
  };

  const loginOrSignUpUser = async (profile) => {
    const userData = getUser(profile);
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return { user: existingUser, success: true, login: true };
      } else {
        const user = new User(userData);
        const response = await user.save();
        return { user: response, success: true, login: false };
      }
    } catch (error) {
      return { success: false, error: error };
    }
  };


  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_APP_ID,
        clientSecret: process.env.GOOGLE_APP_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK,
      },
      async function (accessToken, refreshToken, profile, done) {
        const response = await loginOrSignUpUser(profile);
        if (response.success) {
          return done(null, response?.user);
        } else if (response.error) {
          return done(response.error);
        }
        return null;
      }
    )
  );

  // init passport on every route call.
  app.use(passport.initialize());
  // allow passport to use "express-session".
  app.use(passport.session());
  app.use(passport.authenticate('session'));
};