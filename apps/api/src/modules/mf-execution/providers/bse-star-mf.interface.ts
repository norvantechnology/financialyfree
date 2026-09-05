export interface BseClientRegistrationParams {
  clientCode: string; // Unique Client Code (UCC)
  clientName: string;
  pan: string;
  dateOfBirth: string; // DD/MM/YYYY
  email: string;
  mobile: string;
  bankAccountNo?: string;
  ifscCode?: string;
  taxStatus?: string; // 01 for Resident Individual
}

export interface BseClientRegistrationResult {
  success: boolean;
  clientCode: string;
  status: string;
  bseResponseCode: string;
  message: string;
}

export interface BseSipOrderParams {
  clientCode: string; // UCC
  schemeCode: string; // BSE / AMFI code
  amount: number;
  frequency: 'MONTHLY' | 'WEEKLY' | 'DAILY';
  sipDay: number;
  startDate?: string;
  mandateId?: string;
}

export interface BseSipOrderResult {
  success: boolean;
  registrationNo: string;
  bseOrderNo: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message: string;
  sipDueDate: string;
}

export interface BseLumpsumParams {
  clientCode: string;
  schemeCode: string;
  amount: number;
  paymentMode: 'DIRECT' | 'UPI' | 'NET_BANKING';
}

export interface BseLumpsumResult {
  success: boolean;
  bseOrderNo: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
}

export interface IBseStarMfProvider {
  registerClient(params: BseClientRegistrationParams): Promise<BseClientRegistrationResult>;
  registerSip(params: BseSipOrderParams): Promise<BseSipOrderResult>;
  cancelSip(registrationNo: string): Promise<boolean>;
  placeLumpsumOrder(params: BseLumpsumParams): Promise<BseLumpsumResult>;
  checkOrderStatus(bseOrderNo: string): Promise<{ status: string; remarks: string }>;
}

export const BSE_STAR_MF_PROVIDER = 'BSE_STAR_MF_PROVIDER';
