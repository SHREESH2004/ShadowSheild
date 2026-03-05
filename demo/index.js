import express from "express";
import session from "express-session";
const app = express();

// 1. You MUST use session middleware for req.sessionID to exist
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// 2. Your Logger Middleware
const loggerMiddleware = (req, res, next) => {
  res.on('finish', () => {
    const logData = {
      ip: req.ip,
      endpoint: req.path,
      timestamp: Date.now(),
      statusCode: res.statusCode,
      responseSize: res.getHeader('content-length') || 0,
      // Extracting the Session ID here:
      sessionId: req.sessionID || 'no-session' 
    };

    console.log('Request Log:', logData);
  });

  next();
};

app.use(loggerMiddleware);

app.get('/', (req, res) => {
  res.send('Check your console for the log with Session ID!');
});

app.listen(3000);