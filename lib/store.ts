import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EmployeeData } from '@/types/employee';

interface CustomerData {
  id?: number;
  customerTitle?: string;
  customerName?: string;
  email?: string;
  mobileNo?: string;
  city?: string;
  CustomerType?: string;
  branch?: string;
}

interface AppState {
  // Employee state
  employeeData: EmployeeData | null;
  setEmployeeData: (data: EmployeeData | null) => void;
  
  // Customer state
  customerData: CustomerData | null;
  setCustomerData: (data: CustomerData | null) => void;
  
  // QR code state
  qrCodeUrl: string | null;
  setQrCodeUrl: (url: string | null) => void;
  
  // Clear all state
  clearAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      employeeData: null,
      customerData: null,
      qrCodeUrl: null,
      
      // Actions
      setEmployeeData: (data) => set({ employeeData: data }),
      setCustomerData: (data) => set({ customerData: data }),
      setQrCodeUrl: (url) => set({ qrCodeUrl: url }),
      clearAll: () => set({ 
        employeeData: null, 
        customerData: null, 
        qrCodeUrl: null 
      }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ─── Registration Form Store ──────────────────────────────────────────────────

interface RegistrationFormState {
  // Store & Personal
  selectedStoreId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  
  // Address (jewellery only)
  doorNo: string;
  street: string;
  pincode: string;
  area: string;
  taluk: string;
  city: string;
  state: string;
  country: string;
  
  // UI State
  mobileStep: 1 | 2;
  
  // Actions
  setSelectedStoreId: (value: string) => void;
  setPrefix: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setDoorNo: (value: string) => void;
  setStreet: (value: string) => void;
  setPincode: (value: string) => void;
  setArea: (value: string) => void;
  setTaluk: (value: string) => void;
  setCity: (value: string) => void;
  setState: (value: string) => void;
  setCountry: (value: string) => void;
  setMobileStep: (value: 1 | 2) => void;
  
  // Clear all form data
  clearForm: () => void;
}

export const useRegistrationFormStore = create<RegistrationFormState>()(
  persist(
    (set) => ({
      // Initial state
      selectedStoreId: '',
      prefix: 'Mr',
      firstName: '',
      lastName: '',
      doorNo: '',
      street: '',
      pincode: '',
      area: '',
      taluk: '',
      city: '',
      state: '',
      country: 'India',
      mobileStep: 1,
      
      // Actions
      setSelectedStoreId: (value) => set({ selectedStoreId: value }),
      setPrefix: (value) => set({ prefix: value }),
      setFirstName: (value) => set({ firstName: value }),
      setLastName: (value) => set({ lastName: value }),
      setDoorNo: (value) => set({ doorNo: value }),
      setStreet: (value) => set({ street: value }),
      setPincode: (value) => set({ pincode: value }),
      setArea: (value) => set({ area: value }),
      setTaluk: (value) => set({ taluk: value }),
      setCity: (value) => set({ city: value }),
      setState: (value) => set({ state: value }),
      setCountry: (value) => set({ country: value }),
      setMobileStep: (value) => set({ mobileStep: value }),
      
      clearForm: () => set({
        selectedStoreId: '',
        prefix: 'Mr',
        firstName: '',
        lastName: '',
        doorNo: '',
        street: '',
        pincode: '',
        area: '',
        taluk: '',
        city: '',
        state: '',
        country: 'India',
        mobileStep: 1,
      }),
    }),
    {
      name: 'registration-form-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// ─── Cross Form Store (Textiles-Jewellery) ────────────────────────────────────

interface CrossFormState {
  // Store selection
  selectedJewStoreId: string;
  
  // Address fields
  doorNo: string;
  street: string;
  pincode: string;
  area: string;
  taluk: string;
  city: string;
  state: string;
  country: string;
  
  // UI State
  mobileStep: 1 | 2;
  
  // Actions
  setSelectedJewStoreId: (value: string) => void;
  setDoorNo: (value: string) => void;
  setStreet: (value: string) => void;
  setPincode: (value: string) => void;
  setArea: (value: string) => void;
  setTaluk: (value: string) => void;
  setCity: (value: string) => void;
  setState: (value: string) => void;
  setCountry: (value: string) => void;
  setMobileStep: (value: 1 | 2) => void;
  
  // Clear all form data
  clearForm: () => void;
}

export const useCrossFormStore = create<CrossFormState>()(
  persist(
    (set) => ({
      // Initial state
      selectedJewStoreId: '',
      doorNo: '',
      street: '',
      pincode: '',
      area: '',
      taluk: '',
      city: '',
      state: '',
      country: 'India',
      mobileStep: 1,
      
      // Actions
      setSelectedJewStoreId: (value) => set({ selectedJewStoreId: value }),
      setDoorNo: (value) => set({ doorNo: value }),
      setStreet: (value) => set({ street: value }),
      setPincode: (value) => set({ pincode: value }),
      setArea: (value) => set({ area: value }),
      setTaluk: (value) => set({ taluk: value }),
      setCity: (value) => set({ city: value }),
      setState: (value) => set({ state: value }),
      setCountry: (value) => set({ country: value }),
      setMobileStep: (value) => set({ mobileStep: value }),
      
      clearForm: () => set({
        selectedJewStoreId: '',
        doorNo: '',
        street: '',
        pincode: '',
        area: '',
        taluk: '',
        city: '',
        state: '',
        country: 'India',
        mobileStep: 1,
      }),
    }),
    {
      name: 'cross-form-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
