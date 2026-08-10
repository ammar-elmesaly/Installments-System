export interface SuperAdminSeedPersonConfig {
  first_name: string;
  second_name: string;
  third_name: string;
  last_name: string;
  phone_number: string;
  nick_name?: string;
  profession?: string;
  address?: string;
  image_path?: string;
}

export interface SuperAdminSeedConfig {
  email: string;
  password: string;
  person: SuperAdminSeedPersonConfig;
}

function requireSeedValue(key: string): string {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`[seed-super-admin] Missing required environment variable: ${key}`);
  }

  return value;
}

function optionalSeedValue(key: string): string | undefined {
  const value = process.env[key]?.trim();

  return value ? value : undefined;
}

export function loadSuperAdminSeedConfig(): SuperAdminSeedConfig {
  return {
    email: requireSeedValue('SEED_SUPER_ADMIN_EMAIL'),
    password: requireSeedValue('SEED_SUPER_ADMIN_PASSWORD'),
    person: {
      first_name: requireSeedValue('SEED_SUPER_ADMIN_FIRST_NAME'),
      second_name: requireSeedValue('SEED_SUPER_ADMIN_SECOND_NAME'),
      third_name: requireSeedValue('SEED_SUPER_ADMIN_THIRD_NAME'),
      last_name: requireSeedValue('SEED_SUPER_ADMIN_LAST_NAME'),
      phone_number: requireSeedValue('SEED_SUPER_ADMIN_PHONE_NUMBER'),
      nick_name: optionalSeedValue('SEED_SUPER_ADMIN_NICK_NAME'),
      profession: optionalSeedValue('SEED_SUPER_ADMIN_PROFESSION'),
      address: optionalSeedValue('SEED_SUPER_ADMIN_ADDRESS'),
      image_path: optionalSeedValue('SEED_SUPER_ADMIN_IMAGE_PATH'),
    },
  };
}