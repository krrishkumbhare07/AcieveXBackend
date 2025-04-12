const express = require('express');
const cors = require('cors');
const upscRoutes = require('./routes/upsc');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upsc', upscRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Welcome to AcieveX Backend API',
        documentation: 'https://github.com/krrishkumbhare07/AcieveXBackend#readme'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 