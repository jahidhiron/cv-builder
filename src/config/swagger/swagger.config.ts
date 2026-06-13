import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  enableSwaggerProtection: process.env.ENABLE_SWAGGER_PROTECTION,
  user: process.env.SWAGGER_USER,
  password: process.env.SWAGGER_PASSWORD,
}));
