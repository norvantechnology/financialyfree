import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Used by TypeORM CLI for generating/running migrations
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});
