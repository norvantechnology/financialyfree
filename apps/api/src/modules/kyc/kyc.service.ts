import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycEntity } from '../../database/entities/kyc.entity';
import {
  IKycProvider,
  KYC_PROVIDER,
} from './providers/kyc.interface';
import {
  IBseStarMfProvider,
  BSE_STAR_MF_PROVIDER,
} from '../mf-execution/providers/bse-star-mf.interface';
import {
  InitiateKycDto,
  KycStatusResponseDto,
  KycRecordDto,
} from '@ff/types';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    @InjectRepository(KycEntity)
    private readonly kycRepo: Repository<KycEntity>,
    @Inject(KYC_PROVIDER)
    private readonly kycProvider: IKycProvider,
    @Inject(BSE_STAR_MF_PROVIDER)
    private readonly bseProvider: IBseStarMfProvider,
  ) {}

  private maskPan(pan: string): string {
    if (!pan || pan.length < 10) return 'XXXXXXXXXX';
    return `XXXXX${pan.slice(5)}`;
  }

  async getKycStatus(userId: string): Promise<KycStatusResponseDto> {
    const record = await this.kycRepo.findOne({ where: { userId } });
    if (!record) {
      return {
        status: 'not_started',
        message: 'KYC not started. Please provide your PAN to verify mutual fund eligibility.',
        nextStep: 'Enter PAN and Date of Birth',
      };
    }

    return {
      status: record.status,
      message:
        record.status === 'verified'
          ? 'KYC Verified (CVL KRA). You are eligible to invest in mutual funds.'
          : record.status === 'rejected'
          ? `KYC Rejected: ${record.rejectionReason || 'Invalid documents'}`
          : 'KYC is currently under review.',
      kraProvider: record.kraProvider,
      verifiedAt: record.verifiedAt?.toISOString(),
      nextStep: record.status === 'verified' ? 'Start Goal-Linked SIP' : 'Resolve Rejection',
    };
  }

  async getKycRecord(userId: string): Promise<KycRecordDto | null> {
    const record = await this.kycRepo.findOne({ where: { userId } });
    if (!record) return null;

    return {
      id: record.id,
      userId: record.userId,
      pan: record.panMasked,
      panMasked: record.panMasked,
      status: record.status,
      kraProvider: record.kraProvider,
      verifiedAt: record.verifiedAt?.toISOString(),
      rejectionReason: record.rejectionReason,
      createdAt: (record.createdAt ? new Date(record.createdAt) : new Date()).toISOString(),
      updatedAt: (record.updatedAt ? new Date(record.updatedAt) : new Date()).toISOString(),
    };
  }

  async initiateKyc(userId: string, dto: InitiateKycDto): Promise<KycStatusResponseDto> {
    const panClean = dto.pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panClean)) {
      throw new BadRequestException('Invalid PAN format (e.g. ABCDE1234F)');
    }

    const kraResult = await this.kycProvider.verifyPanKra(panClean, dto.dateOfBirth);

    let record = await this.kycRepo.findOne({ where: { userId } });
    if (!record) {
      record = this.kycRepo.create({
        userId,
        pan: panClean,
        panMasked: this.maskPan(panClean),
        dateOfBirth: dto.dateOfBirth,
        aadhaarLast4: dto.aadhaarLast4,
        status: kraResult.status,
        kraProvider: kraResult.kraProvider,
        verifiedAt: kraResult.isVerified ? new Date() : undefined,
      });
    } else {
      record.pan = panClean;
      record.panMasked = this.maskPan(panClean);
      record.dateOfBirth = dto.dateOfBirth;
      if (dto.aadhaarLast4) record.aadhaarLast4 = dto.aadhaarLast4;
      record.status = kraResult.status;
      record.kraProvider = kraResult.kraProvider;
      if (kraResult.isVerified) record.verifiedAt = new Date();
    }

    // If verified, register client UCC on BSE StAR MF platform
    if (kraResult.isVerified && !record.ucc) {
      const bseUcc = `UCC_${panClean.slice(0, 5)}_${Date.now().toString(36).toUpperCase()}`;
      const regResult = await this.bseProvider.registerClient({
        clientCode: bseUcc,
        clientName: kraResult.name || 'INVESTOR',
        pan: panClean,
        dateOfBirth: dto.dateOfBirth,
        email: 'investor@financiallyfree.local',
        mobile: '9876543210',
      });
      if (regResult.success) {
        record.ucc = regResult.clientCode;
        this.logger.log(`Generated BSE UCC ${record.ucc} for user ${userId}`);
      }
    }

    await this.kycRepo.save(record);

    return {
      status: record.status,
      message: kraResult.message,
      kraProvider: record.kraProvider,
      verifiedAt: record.verifiedAt?.toISOString(),
      nextStep: record.status === 'verified' ? 'Start Goal-Linked SIP' : 'Upload Documents',
    };
  }
}
