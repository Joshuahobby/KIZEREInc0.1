import { createLogger } from './server/utils/logger';

const logger = createLogger('Test');
logger.info('Test log entry');
logger.error('Test error entry', { details: 'Some details' });
console.log('Finished logger test');
