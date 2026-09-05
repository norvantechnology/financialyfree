import { Injectable, Logger } from '@nestjs/common';
import {
  IBseStarMfProvider,
  BseClientRegistrationParams,
  BseClientRegistrationResult,
  BseSipOrderParams,
  BseSipOrderResult,
  BseLumpsumParams,
  BseLumpsumResult,
} from './bse-star-mf.interface';

@Injectable()
export class BseStarMfMockProvider implements IBseStarMfProvider {
  private readonly logger = new Logger(BseStarMfMockProvider.name);

  constructor() {
    this.logger.log('✨ Initialized BseStarMfMockProvider (simulated order routing enabled)');
  }

  async registerClient(params: BseClientRegistrationParams): Promise<BseClientRegistrationResult> {
    const ucc = params.clientCode || `UCC_FF_${Date.now().toString(36).toUpperCase()}`;
    this.logger.log(`[Mock BSE StAR MF] Registered client UCC: ${ucc} for PAN: ${params.pan}`);
    return {
      success: true,
      clientCode: ucc,
      status: 'APPROVED',
      bseResponseCode: '100',
      message: 'Client UCC successfully registered on BSE StAR MF platform',
    };
  }

  async registerSip(params: BseSipOrderParams): Promise<BseSipOrderResult> {
    const regNo = `BSE_SIP_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 900 + 100)}`;
    const orderNo = `ORD_BSE_${Date.now().toString(36).toUpperCase()}`;

    this.logger.log(
      `[Mock BSE StAR MF] SIP Registered — RegNo: ${regNo}, Scheme: ${params.schemeCode}, Amount: ₹${params.amount}, Day: ${params.sipDay}`,
    );

    const nextDueDate = new Date();
    nextDueDate.setDate(params.sipDay);
    if (nextDueDate <= new Date()) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    return {
      success: true,
      registrationNo: regNo,
      bseOrderNo: orderNo,
      status: 'SUCCESS',
      message: 'SIP Registration Successful. AutoPay / eNACH Mandate generated.',
      sipDueDate: nextDueDate.toISOString(),
    };
  }

  async cancelSip(registrationNo: string): Promise<boolean> {
    this.logger.log(`[Mock BSE StAR MF] Cancelled SIP Registration: ${registrationNo}`);
    return true;
  }

  async placeLumpsumOrder(params: BseLumpsumParams): Promise<BseLumpsumResult> {
    const orderNo = `LUMP_BSE_${Date.now().toString(36).toUpperCase()}`;
    this.logger.log(`[Mock BSE StAR MF] Placed Lumpsum order ${orderNo} for ₹${params.amount}`);
    return {
      success: true,
      bseOrderNo: orderNo,
      status: 'SUCCESS',
      message: 'Lumpsum purchase order submitted successfully to BSE StAR MF',
    };
  }

  async checkOrderStatus(bseOrderNo: string): Promise<{ status: string; remarks: string }> {
    return {
      status: 'ALLOTTED',
      remarks: `Order ${bseOrderNo} units successfully allotted by AMC`,
    };
  }
}
