import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Load environment variables from .env file
 */
export function loadEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  
  if (existsSync(envPath)) {
    console.log(`Loading environment variables from ${envPath}`);
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.error('Error loading .env file:', result.error);
    } else {
      console.log('Environment variables loaded successfully');
    }
  } else {
    console.warn(`No .env file found at ${envPath}`);
  }
}

/**
 * Get an environment variable with a fallback value
 */
export function getEnv(key: string, defaultValue?: string): string {
  return process.env[key] || defaultValue || '';
}
