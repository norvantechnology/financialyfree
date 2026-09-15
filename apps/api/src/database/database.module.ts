import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL') || '';
        const isSupabase = /supabase\.(co|com)/i.test(url) || /pooler\.supabase/i.test(url);

        return {
          type: 'postgres' as const,
          url,
          autoLoadEntities: true,
          synchronize: false, // always use migrations
          logging: config.get('NODE_ENV') === 'development',
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: true,
          // Supabase requires TLS; Render free tier often cannot reach IPv6 direct hosts
          ssl: isSupabase || config.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
          extra: isSupabase
            ? {
                // Prefer IPv4 family when pg resolves dual-stack hosts
                family: 4,
              }
            : undefined,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
