import { config } from './server/config';

console.log('--- Environment Verification ---');
console.log('NODE_ENV:', config.NODE_ENV);
console.log('PORT:', config.PORT);
console.log('DB URL:', config.DATABASE_URL ? 'present' : 'missing');
console.log('Cloudinary Cloud Name:', config.CLOUDINARY_CLOUD_NAME || 'MISSING');
console.log('Cloudinary API Key:', config.CLOUDINARY_API_KEY ? 'Present' : 'MISSING');
console.log('Cloudinary API Secret:', config.CLOUDINARY_API_SECRET ? 'Present' : 'MISSING');
console.log('--- End Verification ---');
