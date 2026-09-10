export type UserRole = 'customer' | 'artisan' | 'admin';

export type VerificationDocType = 'nin' | 'voters_card' | 'drivers_license' | 'international_passport';

export interface UserKyc {
  documentType?: VerificationDocType | string;
  idType?: string;
  documentNumber?: string;
  idNumber?: string;
  documentPhotoUrl?: string;
  documentUrl?: string;
  selfiePhotoUrl?: string;
  selfieUrl?: string;
  fullName: string;
  phone?: string;
  residentialAddress?: string;
  state?: string;
  lga?: string;
  status: 'unverified' | 'pending' | 'verified' | 'rejected' | string;
  submittedAt?: number | any;
  verifiedAt?: number | any;
  rejectionReason?: string;
}

export interface LiveLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  updatedAt?: any;
  address?: string;
  active: boolean;
}

export interface User {
  id: string;
  phone?: string;
  phoneNumber?: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatar?: string;
  state?: string;
  lga?: string;
  address?: string;
  walletBalance?: number;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  createdAt: number;
  kyc?: UserKyc;
  isKycVerified?: boolean;
  liveLocation?: LiveLocation;
}

export interface ArtisanProfile {
  userId: string;
  tradeCategory: string;
  yearsExp: number;
  bio: string;
  serviceAreas: string[];
  idCardUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isAvailable: boolean;
  ratingAvg: number;
  totalJobsDone: number;
  priceRange: string;
  portfolioImages?: string[]; // Array of image URLs for past work
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Job {
  id: string;
  customerId: string;
  categoryId: string;
  title: string;
  description: string;
  photos: string[];
  state: string;
  lga: string;
  exactLocation: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'assigned' | 'completed' | 'cancelled';
  assignedArtisanId?: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  jobId?: string; // Optional context
  participants: string[]; // [customerId, artisanId]
  lastMessage?: string;
  lastMessageTime?: number;
  updatedAt: number;
  lastSenderId?: string;
  isRead?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export interface EscrowContract {
  id: string;
  customerId: string;
  customerName: string;
  artisanId: string;
  artisanName: string;
  title: string;
  location?: string;
  amount: number;
  platformFee?: number;
  artisanPayout?: number;
  reviewScore?: number;
  reviewComment?: string;
  status: 'pending_escrow' | 'in_progress' | 'completed' | 'disputed';
  createdAt: number;
  fundedAt?: number;
  completedAt?: number;
}
