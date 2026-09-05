import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const dbUrl =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DATABASE_USER || 'ff_user'}:${encodeURIComponent(
    process.env.DATABASE_PASSWORD || 'ff_pass',
  )}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || 5432}/${
    process.env.DATABASE_NAME || 'financiallyfree'
  }`;

// Used by TypeORM CLI for generating/running migrations
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});
