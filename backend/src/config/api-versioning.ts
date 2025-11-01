// API Versioning Strategy
const API_VERSION = 'v1';

// Versioned routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/banking`, bankingRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);

// Backward compatibility
app.use('/api/auth', authRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/admin', adminRoutes);
