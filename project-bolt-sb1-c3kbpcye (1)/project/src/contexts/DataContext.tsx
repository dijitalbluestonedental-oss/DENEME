import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  currentBalance: number;
  totalDebt: number;
  createdAt: string;
  updatedAt: string;
}

interface Doctor {
  id: string;
  name: string;
  clinicId: string;
  phone?: string;
  email?: string;
  photo?: string;
  currentBalance: number;
  totalDebt: number;
  createdAt: string;
  updatedAt: string;
}

interface ProsthesisType {
  id: string;
  name: string;
  basePrice: number;
  modelPrice?: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface Technician {
  id: string;
  name: string;
  username: string;
  password: string;
  monthlyQuota: number;
  completedJobs: number;
  salary: number;
  isActive: boolean;
  photo?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  barcode: string;
  patientName: string;
  doctorId: string;
  prosthesisTypeId: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'delivered';
  technicianId?: string;
  arrivalDate: string;
  deliveryDate: string;
  completionDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  cost?: number;
  unitCount: number;
  totalPrice: number;
  finalPrice?: number;
  discountAmount?: number;
  isPaid: boolean;
  isDigitalMeasurement: boolean;
  isManualMeasurement: boolean;
  hasModel: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  doctorId: string;
  orderId?: string;
  amount: number;
  date: string;
  type: 'payment' | 'debt';
  description: string;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'technician' | 'accountant';
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  canViewPrices: boolean;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

interface DataContextType {
  // Data
  clinics: Clinic[];
  doctors: Doctor[];
  prosthesisTypes: ProsthesisType[];
  technicians: Technician[];
  orders: Order[];
  payments: Payment[];
  expenses: Expense[];
  users: User[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  connectionStatus: 'checking' | 'connected' | 'error';
  
  // Helper functions
  getDoctorById: (id: string) => Doctor | undefined;
  getProsthesisTypeById: (id: string) => ProsthesisType | undefined;
  getTechnicianById: (id: string) => Technician | undefined;
  getClinicById: (id: string) => Clinic | undefined;
  getDoctorsByClinic: (clinicId: string) => Doctor[];
  getOrdersByDoctor: (doctorId: string) => Order[];
  getPaymentsByDoctor: (doctorId: string) => Payment[];
  
  // CRUD operations
  addClinic: (clinic: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addProsthesisType: (type: Omit<ProsthesisType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addTechnician: (technician: Omit<Technician, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'barcode' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  updateTechnician: (id: string, updates: Partial<Technician>) => Promise<void>;
  updateProsthesisType: (id: string, updates: Partial<ProsthesisType>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  
  deleteExpense: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [prosthesisTypes, setProsthesisTypes] = useState<ProsthesisType[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Helper functions
  const getDoctorById = (id: string) => doctors.find(d => d.id === id);
  const getProsthesisTypeById = (id: string) => prosthesisTypes.find(p => p.id === id);
  const getTechnicianById = (id: string) => technicians.find(t => t.id === id);
  const getClinicById = (id: string) => clinics.find(c => c.id === id);
  const getDoctorsByClinic = (clinicId: string) => doctors.filter(d => d.clinicId === clinicId);
  const getOrdersByDoctor = (doctorId: string) => orders.filter(o => o.doctorId === doctorId);
  const getPaymentsByDoctor = (doctorId: string) => payments.filter(p => p.doctorId === doctorId);

  // Convert snake_case to camelCase
  const convertToCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(convertToCamelCase);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = convertToCamelCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  };

  // Convert camelCase to snake_case
  const convertToSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(convertToSnakeCase);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = convertToSnakeCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  };

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('checking');

      console.log('🔄 Tüm veriler yükleniyor...');

      // Fetch all tables in parallel
      const [
        clinicsResult,
        doctorsResult,
        prosthesisTypesResult,
        techniciansResult,
        ordersResult,
        paymentsResult,
        expensesResult,
        usersResult
      ] = await Promise.all([
        supabase.from('clinics').select('*').order('name'),
        supabase.from('doctors').select('*').order('name'),
        supabase.from('prosthesis_types').select('*').order('name'),
        supabase.from('technicians').select('*').order('name'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('users').select('*').order('name')
      ]);

      // Check for errors
      const results = [
        { name: 'clinics', result: clinicsResult },
        { name: 'doctors', result: doctorsResult },
        { name: 'prosthesis_types', result: prosthesisTypesResult },
        { name: 'technicians', result: techniciansResult },
        { name: 'orders', result: ordersResult },
        { name: 'payments', result: paymentsResult },
        { name: 'expenses', result: expensesResult },
        { name: 'users', result: usersResult }
      ];

      for (const { name, result } of results) {
        if (result.error) {
          console.error(`❌ ${name} tablosu yüklenirken hata:`, result.error);
          throw new Error(`${name} verisi yüklenemedi: ${result.error.message}`);
        }
      }

      // Convert and set data
      setClinics(convertToCamelCase(clinicsResult.data || []));
      setDoctors(convertToCamelCase(doctorsResult.data || []));
      setProsthesisTypes(convertToCamelCase(prosthesisTypesResult.data || []));
      setTechnicians(convertToCamelCase(techniciansResult.data || []));
      setOrders(convertToCamelCase(ordersResult.data || []));
      setPayments(convertToCamelCase(paymentsResult.data || []));
      setExpenses(convertToCamelCase(expensesResult.data || []));
      setUsers(convertToCamelCase(usersResult.data || []));

      setConnectionStatus('connected');
      console.log('✅ Tüm veriler başarıyla yüklendi');
      console.log('📊 Yüklenen veriler:', {
        clinics: clinicsResult.data?.length || 0,
        doctors: doctorsResult.data?.length || 0,
        prosthesisTypes: prosthesisTypesResult.data?.length || 0,
        technicians: techniciansResult.data?.length || 0,
        orders: ordersResult.data?.length || 0,
        payments: paymentsResult.data?.length || 0,
        expenses: expensesResult.data?.length || 0,
        users: usersResult.data?.length || 0
      });

    } catch (err: any) {
      console.error('❌ Veri yükleme hatası:', err);
      setError(err.message || 'Veriler yüklenirken bir hata oluştu');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const addClinic = async (clinic: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('clinics')
      .insert([convertToSnakeCase(clinic)])
      .select();

    if (error) throw error;
    if (data) {
      setClinics(prev => [...prev, ...convertToCamelCase(data)]);
    }
  };

  const addDoctor = async (doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('doctors')
      .insert([convertToSnakeCase(doctor)])
      .select();

    if (error) throw error;
    if (data) {
      setDoctors(prev => [...prev, ...convertToCamelCase(data)]);
    }
  };

  const addProsthesisType = async (type: Omit<ProsthesisType, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('prosthesis_types')
      .insert([convertToSnakeCase(type)])
      .select();

    if (error) throw error;
    if (data) {
      setProsthesisTypes(prev => [...prev, ...convertToCamelCase(data)]);
    }
  };

  const addTechnician = async (technician: Omit<Technician, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('technicians')
      .insert([convertToSnakeCase(technician)])
      .select();

    if (error) throw error;
    if (data) {
      setTechnicians(prev => [...prev, ...convertToCamelCase(data)]);
    }
  };

  const addOrder = async (order: Omit<Order, 'id' | 'barcode' | 'createdAt' | 'updatedAt'>) => {
    // Generate barcode
    const barcode = `BL${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const { data, error } = await supabase
      .from('orders')
      .insert([convertToSnakeCase({ ...order, barcode })])
      .select();

    if (error) throw error;
    if (data) {
      setOrders(prev => [convertToCamelCase(data)[0], ...prev]);
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([convertToSnakeCase(payment)])
      .select();

    if (error) throw error;
    if (data) {
      setPayments(prev => [convertToCamelCase(data)[0], ...prev]);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert([convertToSnakeCase(expense)])
      .select();

    if (error) throw error;
    if (data) {
      setExpenses(prev => [convertToCamelCase(data)[0], ...prev]);
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('users')
      .insert([convertToSnakeCase(user)])
      .select();

    if (error) throw error;
    if (data) {
      setUsers(prev => [...prev, ...convertToCamelCase(data)]);
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { data, error } = await supabase
      .from('orders')
      .update(convertToSnakeCase(updates))
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data) {
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, ...convertToCamelCase(data)[0] } : order
      ));
    }
  };

  const updateTechnician = async (id: string, updates: Partial<Technician>) => {
    const { data, error } = await supabase
      .from('technicians')
      .update(convertToSnakeCase(updates))
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data) {
      setTechnicians(prev => prev.map(tech => 
        tech.id === id ? { ...tech, ...convertToCamelCase(data)[0] } : tech
      ));
    }
  };

  const updateProsthesisType = async (id: string, updates: Partial<ProsthesisType>) => {
    const { data, error } = await supabase
      .from('prosthesis_types')
      .update(convertToSnakeCase(updates))
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data) {
      setProsthesisTypes(prev => prev.map(type => 
        type.id === id ? { ...type, ...convertToCamelCase(data)[0] } : type
      ));
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(convertToSnakeCase(updates))
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data) {
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...convertToCamelCase(data)[0] } : user
      ));
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(convertToSnakeCase(updates))
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data) {
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? { ...expense, ...convertToCamelCase(data)[0] } : expense
      ));
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const refreshData = async () => {
    await fetchAllData();
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        console.log('🔄 Otomatik veri yenileme...');
        fetchAllData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionStatus]);

  const value: DataContextType = {
    // Data
    clinics,
    doctors,
    prosthesisTypes,
    technicians,
    orders,
    payments,
    expenses,
    users,
    
    // Loading states
    loading,
    error,
    connectionStatus,
    
    // Helper functions
    getDoctorById,
    getProsthesisTypeById,
    getTechnicianById,
    getClinicById,
    getDoctorsByClinic,
    getOrdersByDoctor,
    getPaymentsByDoctor,
    
    // CRUD operations
    addClinic,
    addDoctor,
    addProsthesisType,
    addTechnician,
    addOrder,
    addPayment,
    addExpense,
    addUser,
    
    updateOrder,
    updateTechnician,
    updateProsthesisType,
    updateUser,
    updateExpense,
    
    deleteExpense,
    deleteUser,
    
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}