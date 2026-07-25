// datasource.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Initial1784040177354 } from './src/migrations/1784040177354-Initial';
import { InstallmentPlan1784214047886 } from './src/migrations/1784214047886-InstallmentPlan';
import { AllowClientRemoval1784239272259 } from './src/migrations/1784239272259-AllowClientRemoval';
import { ChangeAdminPermissions1784495604516 } from './src/migrations/1784495604516-ChangeAdminPermissions';
import { AddActivityLogsEntity1784984263299 } from './src/migrations/1784984263299-AddActivityLogsEntity';

// Load .env file variables
config();

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  // Use DB_URL if available; otherwise, construct it
  url: process.env.DB_URL 
    ? process.env.DB_URL 
    : `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  synchronize: false, // Must be false when generating migrations!
  
  // Point to the compiled JS files (for production/running) 
  // and TS files (for CLI generation)
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [
    Initial1784040177354,
    InstallmentPlan1784214047886,
    AllowClientRemoval1784239272259,
    ChangeAdminPermissions1784495604516,
    AddActivityLogsEntity1784984263299
  ],
});