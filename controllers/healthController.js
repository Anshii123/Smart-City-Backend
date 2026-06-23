export const getHealth = (req, res, next) => {
  try {
    const healthInfo = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'DISCONNECTED', // MongoDB is not created yet
      }
    };
    
    res.status(200).json(healthInfo);
  } catch (error) {
    next(error);
  }
};
