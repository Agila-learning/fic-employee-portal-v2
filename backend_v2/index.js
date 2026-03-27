const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

dotenv.config({ override: true });

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));

// DB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fic_employee_portal';
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB Connected Successfully');
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('CRITICAL: MongoDB Connection Error:', err.message);
        process.exit(1); // Exit if DB connection fails in production
    });

// Routes
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
// const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const operationRoutes = require('./routes/operationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const policyRoutes = require('./routes/policyRoutes');

app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
// app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/utility', utilityRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/policies', policyRoutes);

// Initialize Cron Jobs
const { initCronJobs } = require('./services/cronService');
initCronJobs();

app.get('/', (req, res) => {
    res.send('FIC Employee Portal API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// No separate listen() here, moved into DB connection handler above

