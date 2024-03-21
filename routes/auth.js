import express from 'express';
import passport from 'passport';

const router = express.Router();

const env = process.env;

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${env.FRONTEND_URL}/${env.FRONTEND_LOGIN_FAILURE_URL}` }),
  (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect(`${env.FRONTEND_URL}/${env.FRONTEND_LOGIN_SUCCESS_URL}`);
    }
  }
);

router.get('/login/status', async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      return res.status(200).json({ user: req.user });
    } else {
      return res
        .status(401)
        .json({ message: 'Unauthorzed to perform action', code: 'UNAUTHORIZED' });
    }
  } catch (error) {
    console.log('Error while checking login status', error.message);
    res.status(500).json({ message: 'internal server error' });
  }
});

router.get('/logout', async (req, res) => {
  try {
    req.logOut(error => {
      if (error) throw error;
      return res.status(200).end();
      // return res.status(200).redirect(`${env.FRONTEND_URL}/${env.FRONTEND_LOGIN_FAILURE_URL}`);
    });
  } catch (error) {
    console.log('Error in logout => ', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;