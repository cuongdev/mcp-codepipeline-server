import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Load environment variables from .env file
 */
export function loadEnv(): void {
  const envPath = resolve(import.meta.dirname, '../../.env');
  const envPathCwd = resolve(process.cwd(), '.env');
  
  if (existsSync(envPath)) {
    console.log(`Loading environment variables from ${envPath}`);
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.error('Error loading .env file:', result.error);
    } else {
      console.log('Environment variables loaded successfully');
    }
  } else {
    if (existsSync(envPathCwd)) {
      console.log(`Loading environment variables from ${envPathCwd}`);
      const result = dotenv.config({ path: envPathCwd });
      
      if (result.error) {
        console.error('Error loading .env file from current working directory:', result.error);
      } else {
        console.log('Environment variables loaded successfully from current working directory');
      }
    } else {
      console.warn(`No .env file found at ${envPath} or ${envPathCwd}`);
    }
  }
}

/**
 * Get an environment variable with a fallback value
 */
export function getEnv(key: string, defaultValue?: string): string {
  return process.env[key] || defaultValue || '';
}
