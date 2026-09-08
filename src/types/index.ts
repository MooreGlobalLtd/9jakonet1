export type UserRole = 'customer' | 'artisan' | 'admin';

export interface User {
  id: string;
  phone?: string;
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
  amount: number;
  platformFee?: number;
  artisanPayout?: number;
  reviewScore?: number;
  reviewComment?: string;
  status: 'pending_escrow' | 'in_progress' | 'completed' | 'disputed';
  createdAt: number;
}
