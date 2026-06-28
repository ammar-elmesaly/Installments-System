import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PeopleController } from './people/people.controller';
import { PeopleModule } from './people/people.module';
import { Person } from './people/people.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: String(process.env.DB_HOST || 'localhost'),
      port: Number(process.env.DB_PORT) || 5432,
      username: String(process.env.DB_USERNAME),
      password: String(process.env.DB_PASSWORD),
      database: String(process.env.DB_NAME),
      synchronize: process.env.NODE_ENV !== 'production',
      entities: [
        Person
      ]
    }),
    PeopleModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

/*
* Use DATABASE_URL instead (neon)
TypeOrmModule.forRoot({
  type: "postgres",
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/local_db',
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' 
    ? { rejectUnauthorized: false } // Required for Neon cloud connection
    : false,                        // Disabled for local development if not needed
  synchronize: process.env.NODE_ENV !== 'production' && process.env.DB_SYNCHRONIZE === 'true',
  entities: [
    // Your entities here
  ]
})
*/