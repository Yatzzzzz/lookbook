import jwt from 'jsonwebtoken';

/**
 * Generates a JWT token for KlingAI API authentication
 * Following KlingAI specifications: https://api.klingai.com/docs
 */
export function generateKlingAIToken(): string {
  const accessKey = process.env.KLINGAI_ACCESS_KEY;
  const secretKey = process.env.KLINGAI_SECRET_KEY;
  
  if (!accessKey || !secretKey) {
    throw new Error('KLINGAI_ACCESS_KEY and KLINGAI_SECRET_KEY must be set in environment variables');
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: accessKey,
    exp: now + 1800, // Token valid for 30 minutes
    nbf: now - 5     // Token valid from 5 seconds ago (to handle clock skew)
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  return jwt.sign(payload, secretKey, { header });
} 