/**
 * Subscription API - Parent subscription packages and payment
 * Based on SUBSCRIPTION_MOBILE_API.md
 */

import { apiClient } from './config';
import type { ApiResponse } from '../../types/api';

export interface PackageClass {
  id: number;
  name: string;
  code: string;
  pivot?: { package_id: number; class_id: number };
}

export interface SubscriptionPackage {
  id: number;
  name: string;
  price: string;
  description: string;
  student_limit: number;
  allows_one_on_one: boolean;
  bank_details: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  classes?: PackageClass[];
}

export interface PendingPayment {
  id: number;
  parent_id: number;
  package_id: number;
  amount: string;
  status: string;
  payment_slip_url: string;
  created_at: string;
  package?: { id: number; name: string; price: string };
}

export interface MySubscription {
  package: SubscriptionPackage | null;
  status: 'active' | 'pending' | 'rejected' | 'expired' | 'cancelled' | null;
  approved_at: string | null;
  current_student_count: number;
  limits: {
    student_limit: number;
    allows_one_on_one: boolean;
    classes: PackageClass[];
  } | null;
  pending_payment: PendingPayment | null;
}

export interface PaymentSubmission {
  id: number;
  parent_id: number;
  package_id: number;
  amount: string;
  payment_slip_path: string;
  payment_slip_url: string;
  status: string;
  admin_notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  package?: { id: number; name: string; price: string };
}

export const subscriptionService = {
  getPackages: async (): Promise<ApiResponse<SubscriptionPackage[]>> => {
    const response = await apiClient.get<ApiResponse<SubscriptionPackage[]>>(
      '/parent/subscription/packages'
    );
    return response.data;
  },

  getPackageDetails: async (
    id: number
  ): Promise<ApiResponse<SubscriptionPackage>> => {
    const response = await apiClient.get<ApiResponse<SubscriptionPackage>>(
      `/parent/subscription/packages/${id}`
    );
    return response.data;
  },

  getMySubscription: async (): Promise<ApiResponse<MySubscription>> => {
    const response = await apiClient.get<ApiResponse<MySubscription>>(
      '/parent/subscription/my-subscription'
    );
    return response.data;
  },

  submitPayment: async (
    packageId: number,
    paymentSlip: { uri: string; type: string; name: string }
  ): Promise<ApiResponse<PaymentSubmission>> => {
    const formData = new FormData();
    
    // Append package_id as string
    formData.append('package_id', packageId.toString());
    
    // Append file for React Native - format is different from web
    // React Native FormData requires: { uri, type, name }
    // Ensure proper file extension in name
    let fileName = paymentSlip.name || 'payment_slip.jpg';
    if (!fileName.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      fileName = fileName.replace(/\.[^/.]+$/, '') + '.jpg';
    }
    
    const fileData: any = {
      uri: paymentSlip.uri,
      type: paymentSlip.type || 'image/jpeg',
      name: fileName,
    };
    
    formData.append('payment_slip', fileData);

    console.log('Submitting payment:', {
      packageId,
      uri: paymentSlip.uri,
      type: paymentSlip.type,
      name: fileName,
      formDataKeys: ['package_id', 'payment_slip'],
      isFormData: formData instanceof FormData,
    });

    try {
      // For React Native, explicitly set multipart/form-data and use transformRequest
      const requestConfig: any = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data', // Axios will add boundary automatically
        },
        timeout: 30000,
        // transformRequest prevents axios from converting FormData to JSON
        transformRequest: (data: any) => {
          // Return FormData as-is - don't transform it
          return data;
        },
      };

      console.log('Request config:', {
        hasFormData: formData instanceof FormData,
        headers: requestConfig.headers,
      });

      const response = await apiClient.post<ApiResponse<PaymentSubmission>>(
        '/parent/subscription/payment',
        formData,
        requestConfig
      );
      return response.data;
    } catch (error: any) {
      console.error('Payment submission error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        dataType: error.config?.data instanceof FormData ? 'FormData' : typeof error.config?.data,
      });
      throw error;
    }
  },
};
