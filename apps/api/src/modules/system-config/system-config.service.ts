import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettingEntity } from '../../database/entities/system-setting.entity';

export type AccessMode = 'FREE' | 'SUBSCRIPTION';

export interface AccessModeResult {
  mode: AccessMode;
  isAllAccessFree: boolean;
  updatedAt: string;
}

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private readonly logger = new Logger(SystemConfigService.name);
  private cachedMode: AccessMode = 'FREE';
  private cachedUpdatedAt: string = new Date().toISOString();
  private lastCacheTime = 0;
  private readonly CACHE_TTL_MS = 15000; // 15 seconds

  constructor(
    @InjectRepository(SystemSettingEntity)
    private readonly settingRepo: Repository<SystemSettingEntity>,
  ) {}

  async onModuleInit() {
    await this.getAccessMode();
  }

  /**
   * Retrieves the current access mode.
   * Cached in memory for speed; refreshed every 15s or immediately on write.
   */
  async getAccessMode(): Promise<AccessModeResult> {
    const now = Date.now();
    if (now - this.lastCacheTime < this.CACHE_TTL_MS) {
      return {
        mode: this.cachedMode,
        isAllAccessFree: this.cachedMode === 'FREE',
        updatedAt: this.cachedUpdatedAt,
      };
    }

    try {
      const setting = await this.settingRepo.findOne({
        where: { key: 'SUBSCRIPTION_ACCESS_MODE' },
      });

      if (setting && (setting.value === 'FREE' || setting.value === 'SUBSCRIPTION')) {
        this.cachedMode = setting.value as AccessMode;
        this.cachedUpdatedAt = setting.updatedAt ? setting.updatedAt.toISOString() : new Date().toISOString();
      } else {
        // Fallback default: FREE
        this.cachedMode = 'FREE';
        this.cachedUpdatedAt = new Date().toISOString();
      }
    } catch (err) {
      this.logger.warn(`Could not read SUBSCRIPTION_ACCESS_MODE from DB, defaulting to FREE: ${err}`);
      this.cachedMode = 'FREE';
    }

    this.lastCacheTime = now;
    return {
      mode: this.cachedMode,
      isAllAccessFree: this.cachedMode === 'FREE',
      updatedAt: this.cachedUpdatedAt,
    };
  }

  /**
   * Updates the global platform access mode in PostgreSQL.
   */
  async setAccessMode(mode: AccessMode): Promise<AccessModeResult> {
    const validMode: AccessMode = mode === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'FREE';
    const now = new Date();

    let setting = await this.settingRepo.findOne({
      where: { key: 'SUBSCRIPTION_ACCESS_MODE' },
    });

    if (!setting) {
      setting = this.settingRepo.create({
        key: 'SUBSCRIPTION_ACCESS_MODE',
        value: validMode,
        description:
          'Global platform access switch: FREE (all tabs and tools unlocked for everyone) or SUBSCRIPTION (requires active plan/entitlements).',
        updatedAt: now,
      });
    } else {
      setting.value = validMode;
      setting.updatedAt = now;
    }

    await this.settingRepo.save(setting);

    this.cachedMode = validMode;
    this.cachedUpdatedAt = now.toISOString();
    this.lastCacheTime = Date.now();

    this.logger.log(`⚡ Global Platform Access Mode set to: [${validMode}] (isAllAccessFree: ${validMode === 'FREE'})`);

    return {
      mode: validMode,
      isAllAccessFree: validMode === 'FREE',
      updatedAt: this.cachedUpdatedAt,
    };
  }

  /**
   * Synchronous helper checking cached state.
   */
  isAllAccessFreeNow(): boolean {
    return this.cachedMode === 'FREE';
  }
}
