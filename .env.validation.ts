enum Environment {
  Production = 'production',
  Development = 'development'
}

export class EnvironmentVariables {
  NODE_ENV!: Environment;
  PORT?: string;
  JWT_SECRET!: string;
  DB_URL?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  CRON_SECRET_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_ADMIN_CHAT_ID?: string;
}

export function validate(config: Record<string, unknown>) {
  const errors: string[] = [];
  const validatedConfig = new EnvironmentVariables();

  const getString = (key: string) => {
    const value = config[key];

    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  };

  const requireString = (key: string) => {
    const value = getString(key);

    if (!value) {
      errors.push(`${key} is required`);
    }

    return value;
  };

  const requirePort = (key: string) => {
    const value = requireString(key);

    if (value && !/^\d+$/.test(value)) {
      errors.push(`${key} must be a valid port`);
    }

    return value;
  };

  const nodeEnv = requireString('NODE_ENV');

  if (nodeEnv && nodeEnv !== Environment.Production && nodeEnv !== Environment.Development) {
    errors.push('NODE_ENV must be either production or development');
  }

  validatedConfig.NODE_ENV = nodeEnv as Environment;
  validatedConfig.PORT = getString('PORT');
  validatedConfig.JWT_SECRET = requireString('JWT_SECRET') ?? '';
  validatedConfig.DB_URL = getString('DB_URL');
  validatedConfig.CRON_SECRET_KEY = getString('CRON_SECRET_KEY');
  validatedConfig.TELEGRAM_BOT_TOKEN = getString('TELEGRAM_BOT_TOKEN');
  validatedConfig.TELEGRAM_ADMIN_CHAT_ID = getString('TELEGRAM_ADMIN_CHAT_ID');

  if (!validatedConfig.DB_URL) {
    validatedConfig.DB_HOST = requireString('DB_HOST');
    validatedConfig.DB_PORT = requirePort('DB_PORT');
    validatedConfig.DB_USERNAME = requireString('DB_USERNAME');
    validatedConfig.DB_PASSWORD = requireString('DB_PASSWORD');
    validatedConfig.DB_NAME = requireString('DB_NAME');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return validatedConfig;
}