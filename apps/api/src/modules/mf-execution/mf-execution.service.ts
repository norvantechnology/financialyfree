import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MfSchemeEntity,
  MfOrderEntity,
  MfFolioEntity,
} from '../../database/entities/mf.entity';
import { KycEntity } from '../../database/entities/kyc.entity';
import {
  IBseStarMfProvider,
  BSE_STAR_MF_PROVIDER,
} from './providers/bse-star-mf.interface';
import {
  CreateSipOrderRequest,
  MfOrderDto,
  FolioDto,
  MutualFundDto,
} from '@ff/types';

@Injectable()
export class MfExecutionService implements OnModuleInit {
  private readonly logger = new Logger(MfExecutionService.name);

  constructor(
    @InjectRepository(MfSchemeEntity)
    private readonly schemeRepo: Repository<MfSchemeEntity>,
    @InjectRepository(MfOrderEntity)
    private readonly orderRepo: Repository<MfOrderEntity>,
    @InjectRepository(MfFolioEntity)
    private readonly folioRepo: Repository<MfFolioEntity>,
    @InjectRepository(KycEntity)
    private readonly kycRepo: Repository<KycEntity>,
    @Inject(BSE_STAR_MF_PROVIDER)
    private readonly bseProvider: IBseStarMfProvider,
  ) {}

  async onModuleInit() {
    await this.seedCuratedSchemes();
  }

  async seedCuratedSchemes() {
    const count = await this.schemeRepo.count();
    if (count > 0) return;

    this.logger.log('🌱 Seeding curated AMFI Mutual Fund schemes...');
    const schemes: Partial<MfSchemeEntity>[] = [
      {
        schemeCode: '119551',
        schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
        amcName: 'PPFAS Mutual Fund',
        category: 'Equity - Flexi Cap',
        subCategory: 'Growth',
        navCurrent: 82.451,
        navDate: new Date().toISOString().split('T')[0],
        expenseRatio: 0.62,
        exitLoad: '2% within 365 days, 1% within 730 days',
        returns1yr: 28.5,
        returns3yr: 21.2,
        returns5yr: 24.8,
        riskLevel: 'very_high',
        minSipAmount: 1000,
        isRecommended: true,
        isActive: true,
      },
      {
        schemeCode: '120503',
        schemeName: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
        amcName: 'Mirae Asset Mutual Fund',
        category: 'Equity - Large Cap',
        subCategory: 'Growth',
        navCurrent: 112.38,
        navDate: new Date().toISOString().split('T')[0],
        expenseRatio: 0.54,
        exitLoad: '1% within 365 days',
        returns1yr: 24.1,
        returns3yr: 16.5,
        returns5yr: 18.2,
        riskLevel: 'very_high',
        minSipAmount: 1000,
        isRecommended: true,
        isActive: true,
      },
      {
        schemeCode: '118778',
        schemeName: 'Nippon India Small Cap Fund - Direct Plan - Growth',
        amcName: 'Nippon India Mutual Fund',
        category: 'Equity - Small Cap',
        subCategory: 'Growth',
        navCurrent: 174.62,
        navDate: new Date().toISOString().split('T')[0],
        expenseRatio: 0.69,
        exitLoad: '1% within 30 days',
        returns1yr: 38.4,
        returns3yr: 28.7,
        returns5yr: 31.4,
        riskLevel: 'very_high',
        minSipAmount: 1000,
        isRecommended: true,
        isActive: true,
      },
      {
        schemeCode: '120847',
        schemeName: 'ICICI Prudential Liquid Fund - Direct Plan - Growth',
        amcName: 'ICICI Prudential Mutual Fund',
        category: 'Debt - Liquid',
        subCategory: 'Growth',
        navCurrent: 365.12,
        navDate: new Date().toISOString().split('T')[0],
        expenseRatio: 0.2,
        exitLoad: 'Graded exit load up to 7 days, Nil thereafter',
        returns1yr: 7.2,
        returns3yr: 6.5,
        returns5yr: 5.9,
        riskLevel: 'low',
        minSipAmount: 500,
        isRecommended: true,
        isActive: true,
      },
    ];

    for (const s of schemes) {
      const entity = this.schemeRepo.create(s);
      await this.schemeRepo.save(entity);
    }
    this.logger.log('✅ Seeded 4 curated mutual fund schemes');
  }

  async getSchemes(category?: string): Promise<MutualFundDto[]> {
    const query = this.schemeRepo.createQueryBuilder('s').where('s.isActive = true');
    if (category) {
      query.andWhere('s.category ILIKE :cat', { cat: `%${category}%` });
    }
    const schemes = await query.orderBy('s.returns3yr', 'DESC').getMany();

    return schemes.map((s) => ({
      id: s.id,
      schemeCode: s.schemeCode,
      schemeName: s.schemeName,
      amcName: s.amcName,
      category: s.category,
      subCategory: s.subCategory,
      navCurrent: Number(s.navCurrent),
      navDate: s.navDate,
      expenseRatio: Number(s.expenseRatio),
      exitLoad: s.exitLoad,
      returns1yr: s.returns1yr ? Number(s.returns1yr) : undefined,
      returns3yr: s.returns3yr ? Number(s.returns3yr) : undefined,
      returns5yr: s.returns5yr ? Number(s.returns5yr) : undefined,
      riskLevel: s.riskLevel as any,
    }));
  }

  async createSipOrder(userId: string, dto: CreateSipOrderRequest): Promise<MfOrderDto> {
    const kyc = await this.kycRepo.findOne({ where: { userId } });
    if (!kyc || kyc.status !== 'verified') {
      throw new BadRequestException('KYC verification required before placing Mutual Fund orders.');
    }

    const scheme = await this.schemeRepo.findOne({ where: { schemeCode: dto.schemeCode } });
    if (!scheme) {
      throw new NotFoundException(`Scheme with code ${dto.schemeCode} not found`);
    }

    if (dto.amount < scheme.minSipAmount) {
      throw new BadRequestException(`Minimum SIP amount for ${scheme.schemeName} is ₹${scheme.minSipAmount}`);
    }

    const clientCode = kyc.ucc || `UCC_${Date.now().toString(36).toUpperCase()}`;

    // Place SIP order via BSE StAR MF provider
    const bseResult = await this.bseProvider.registerSip({
      clientCode,
      schemeCode: scheme.schemeCode,
      amount: dto.amount,
      frequency: 'MONTHLY',
      sipDay: dto.sipDayOfMonth || 10,
    });

    const mockFolio = `FOLIO_${scheme.amcName.slice(0, 4).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;

    // Create MF Order record
    const order = this.orderRepo.create({
      userId,
      goalId: dto.goalId || null,
      schemeCode: scheme.schemeCode,
      orderType: 'sip',
      amount: dto.amount,
      sipDayOfMonth: dto.sipDayOfMonth || 10,
      status: 'submitted',
      bseOrderNo: bseResult.bseOrderNo,
      bseRegistrationNo: bseResult.registrationNo,
      folioNumber: mockFolio,
      placedAt: new Date(),
    });

    const savedOrder = await this.orderRepo.save(order);

    // Create or update folio holding in simulated portfolio
    let folio = await this.folioRepo.findOne({
      where: { userId, schemeCode: scheme.schemeCode },
    });

    const initialUnits = Math.round((dto.amount / Number(scheme.navCurrent)) * 1000) / 1000;

    if (!folio) {
      folio = this.folioRepo.create({
        userId,
        folioNumber: mockFolio,
        amcName: scheme.amcName,
        schemeCode: scheme.schemeCode,
        schemeName: scheme.schemeName,
        units: initialUnits,
        navCurrent: Number(scheme.navCurrent),
        investedAmount: dto.amount,
        currentValue: Math.round(initialUnits * Number(scheme.navCurrent)),
        xirr: scheme.returns3yr ? Number(scheme.returns3yr) : 14.5,
      });
    } else {
      folio.units = Number(folio.units) + initialUnits;
      folio.investedAmount = Number(folio.investedAmount) + dto.amount;
      folio.currentValue = Math.round(Number(folio.units) * Number(scheme.navCurrent));
    }
    await this.folioRepo.save(folio);

    return {
      id: savedOrder.id,
      userId: savedOrder.userId,
      schemeCode: savedOrder.schemeCode,
      orderType: savedOrder.orderType,
      amount: Number(savedOrder.amount),
      status: savedOrder.status,
      bseOrderNo: savedOrder.bseOrderNo,
      placedAt: savedOrder.placedAt.toISOString(),
      nav: Number(scheme.navCurrent),
    };
  }

  async getUserOrders(userId: string): Promise<MfOrderDto[]> {
    const orders = await this.orderRepo.find({
      where: { userId },
      order: { placedAt: 'DESC' },
    });

    return orders.map((o) => ({
      id: o.id,
      userId: o.userId,
      schemeCode: o.schemeCode,
      orderType: o.orderType,
      amount: Number(o.amount),
      status: o.status,
      bseOrderNo: o.bseOrderNo,
      placedAt: o.placedAt.toISOString(),
      settledAt: o.settledAt?.toISOString(),
      unitsAllotted: o.unitsAllotted ? Number(o.unitsAllotted) : undefined,
    }));
  }

  async getUserPortfolio(userId: string): Promise<{
    holdings: FolioDto[];
    totalInvested: number;
    totalCurrentValue: number;
    totalGain: number;
    overallReturnPct: number;
  }> {
    const folios = await this.folioRepo.find({ where: { userId } });

    const holdings: FolioDto[] = folios.map((f) => {
      const invested = Number(f.investedAmount);
      const current = Number(f.currentValue);
      const gain = current - invested;
      const gainPct = invested > 0 ? Math.round((gain / invested) * 10000) / 100 : 0;

      return {
        id: f.id,
        userId: f.userId,
        folioNumber: f.folioNumber,
        amcName: f.amcName,
        schemeName: f.schemeName,
        schemeCode: f.schemeCode,
        units: Number(f.units),
        navCurrent: Number(f.navCurrent),
        investedAmount: invested,
        currentValue: current,
        gain,
        gainPct,
        lastUpdated: (f.lastUpdated ? new Date(f.lastUpdated) : new Date()).toISOString(),
      };
    });

    const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
    const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalGain = totalCurrentValue - totalInvested;
    const overallReturnPct =
      totalInvested > 0 ? Math.round((totalGain / totalInvested) * 10000) / 100 : 0;

    return {
      holdings,
      totalInvested,
      totalCurrentValue,
      totalGain,
      overallReturnPct,
    };
  }
}
