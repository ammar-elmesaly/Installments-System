import 'reflect-metadata';
import { AppDataSource } from '../../datasource';
import { loadSuperAdminSeedConfig } from './super-admin.seed.config';
import { SuperAdminSeeder } from './super-admin.seeder';

async function bootstrap() {
  const config = loadSuperAdminSeedConfig();

  await AppDataSource.initialize();

  try {
    const seeder = new SuperAdminSeeder(AppDataSource, config);
    await seeder.seed();
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

bootstrap().catch(error => {
  console.error('[seed-super-admin] Seeding failed');
  console.error(error);
  process.exitCode = 1;
});