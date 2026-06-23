import morgan from 'morgan';
import config from '../config/config.js';

const requestLogger = config.env === 'development' 
  ? morgan('dev') 
  : morgan('combined');

export default requestLogger;
