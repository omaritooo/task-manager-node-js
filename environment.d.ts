declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;
      EMAIL_HOST: string;
      EMAIL_PORT: number;
      JWT_COOKIE_EXPIRY: number;
      NODE_ENV: 'development' | 'production';
    }
  }
}
