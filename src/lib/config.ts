// Configuration for API endpoints and credentials

export const API_CONFIG = {
  pingOne: {
    environmentId: 'fd4cecf9-f6b6-45da-a0c3-2f8af9874182',
    clientId: 'ef43be76-0866-4fe7-ab99-45bca5bf008c',
    clientSecret: 'vUk-gCakP-5k5g_Lzt.N~sazuIXx4VeITHXnigZTZLJNlptvFCupSjBQT3KxEAGo',
    baseUrl: 'https://auth.pingone.eu',
    apiPath: 'https://api.pingone.eu/v1',
    populationId: 'b530a0ee-64cf-4411-8e42-2659c01c7459'
  },
  pingDaVinci: {
    // Placeholder for PingDaVinci configuration
    baseUrl: 'https://api.pingdavinci.com', // This would be the actual URL
    apiKey: 'your-pingdavinci-api-key' // This would be configured via environment variables
  }
} as const;

// Environment-specific configurations
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// API timeout settings
export const API_TIMEOUTS = {
  pingOne: 10000, // 10 seconds
  pingDaVinci: 15000, // 15 seconds
  default: 8000 // 8 seconds
} as const;

// Application configuration
export const APP_CONFIG = {
  NAME: 'NatWest Credit Card Application',
  VERSION: '1.0.0',
  DESCRIPTION: 'Digital ID verification for credit card applications',
  COMPANY: 'NatWest Bank'
} as const;
