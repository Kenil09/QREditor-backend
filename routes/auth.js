import express from 'express';
import passport from 'passport';

const router = express.Router();

const env = process.env;

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${env.DOMAIN_URL}/${env.FRONTEND_LOGIN_FAILURE_URL}` }),
  (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect(`${env.DOMAIN_URL}/${env.FRONTEND_LOGIN_SUCCESS_URL}`);
    }
  }
);