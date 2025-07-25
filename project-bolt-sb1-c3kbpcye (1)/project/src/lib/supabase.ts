import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase yapılandırması kontrol ediliyor...');
console.log('URL:', supabaseUrl);
console.log('URL mevcut:', !!supabaseUrl);
console.log('Anahtar mevcut:', !!supabaseAnonKey);
console.log('Anahtar uzunluğu:', supabaseAnonKey?.length || 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase ortam değişkenleri eksik!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Mevcut' : 'Eksik');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Mevcut' : 'Eksik');
  throw new Error('Missing Supabase environment variables');
}

// Check if we have placeholder values
const hasPlaceholderValues = 
  supabaseUrl.includes('your-project-id') || 
  supabaseUrl.includes('localhost') ||
  supabaseAnonKey.includes('your-anon-key') ||
  supabaseAnonKey.length < 100; // Supabase keys are typically much longer

if (hasPlaceholderValues) {
  console.error('❌ Supabase ortam değişkenleri placeholder değerler içeriyor!');
  console.error('Lütfen .env dosyasındaki değerleri gerçek Supabase proje bilgilerinizle güncelleyin.');
  throw new Error('Supabase environment variables contain placeholder values');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('❌ Geçersiz Supabase URL formatı:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

console.log('✅ Supabase ortam değişkenleri doğru görünüyor');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});

// Enhanced connection test with better error handling
export const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Supabase bağlantısı test ediliyor...');
    console.log('🌐 Test URL:', supabaseUrl);
    
    // First, try a simple health check to the REST API
    const healthCheckUrl = `${supabaseUrl}/rest/v1/`;
    console.log('🏥 Health check URL:', healthCheckUrl);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 15000);
    });

    // Try basic server connectivity first
    try {
      const healthResponse = await Promise.race([
        fetch(healthCheckUrl, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }),
        timeoutPromise
      ]);

      console.log('🏥 Health check response status:', healthResponse.status);
      
      if (!healthResponse.ok && healthResponse.status !== 404) {
        // 404 is acceptable for health check, it means the server is reachable
        throw new Error(`Health check failed with status: ${healthResponse.status}`);
      }
    } catch (healthError: any) {
      console.error('❌ Health check failed:', healthError);
      
      if (healthError.message === 'Connection timeout') {
        return { success: false, error: 'Bağlantı zaman aşımına uğradı. Supabase URL\'sini ve internet bağlantınızı kontrol edin.' };
      } else if (healthError.name === 'TypeError' && healthError.message.includes('Failed to fetch')) {
        return { success: false, error: 'Supabase sunucusuna erişilemiyor. URL ve internet bağlantınızı kontrol edin.' };
      } else {
        return { success: false, error: `Sunucu erişim hatası: ${healthError.message}` };
      }
    }

    // If health check passes, try the actual database query
    console.log('🗄️ Veritabanı sorgusu test ediliyor...');
    
    const connectionTest = supabase
      .from('users')
      .select('count')
      .limit(1);

    const { data, error } = await Promise.race([connectionTest, timeoutPromise]);

    if (error) {
      console.error('❌ Supabase veritabanı sorgusu başarısız:', error);
      
      let errorMessage = 'Veritabanı bağlantısı kurulamadı.';
      
      if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
        errorMessage = 'API anahtarınız geçersiz. Lütfen Supabase dashboard\'ından doğru anahtarı kopyalayın.';
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        errorMessage = 'Veritabanı tabloları henüz oluşturulmamış. Lütfen SQL migration\'ları çalıştırın.';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        errorMessage = 'Supabase sunucusuna bağlanılamıyor. İnternet bağlantınızı ve Supabase URL\'sini kontrol edin.';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'CORS hatası: Supabase projesi ayarları kontrol edilmeli.';
      } else if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        errorMessage = 'Veritabanı erişim izni hatası. RLS politikaları kontrol edilmeli.';
      } else {
        errorMessage = `Veritabanı hatası: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    } else {
      console.log('✅ Supabase bağlantısı başarılı');
      console.log('📊 Veritabanı erişimi çalışıyor');
      return { success: true };
    }
  } catch (err: any) {
    console.error('❌ Supabase bağlantı hatası:', err);
    
    let errorMessage = 'Bağlantı hatası oluştu.';
    
    if (err.message === 'Connection timeout') {
      errorMessage = 'Bağlantı zaman aşımına uğradı. Supabase URL\'sini ve internet bağlantınızı kontrol edin.';
    } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      errorMessage = 'Supabase sunucusuna erişilemiyor. URL ve internet bağlantınızı kontrol edin.';
    } else if (err.message?.includes('NetworkError')) {
      errorMessage = 'Ağ hatası: İnternet bağlantınızı kontrol edin.';
    } else {
      errorMessage = `Bilinmeyen bağlantı hatası: ${err.message}`;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Alternative basic connection test
export const testBasicConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Temel bağlantı testi yapılıyor...');
    
    const healthCheckUrl = `${supabaseUrl}/rest/v1/`;
    
    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🏥 Temel bağlantı response status:', response.status);
    
    // Any response (even 404) means the server is reachable
    if (response.status === 401) {
      return { success: false, error: 'API anahtarınız geçersiz. Lütfen Supabase dashboard\'ından doğru anahtarı kopyalayın.' };
    } else if (response.status >= 200 && response.status < 500) {
      console.log('✅ Temel Supabase bağlantısı başarılı');
      return { success: true };
    } else {
      return { success: false, error: `Sunucu hatası: ${response.status}` };
    }
  } catch (err: any) {
    console.error('❌ Temel bağlantı testi hatası:', err);
    
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      return { success: false, error: 'Supabase sunucusuna erişilemiyor. URL ve internet bağlantınızı kontrol edin.' };
    } else {
      return { success: false, error: `Bağlantı hatası: ${err.message}` };
    }
  }
};

// Connection status management
let connectionTestPromise: Promise<{ success: boolean; error?: string }> | null = null;

export const getConnectionStatus = () => {
  if (!connectionTestPromise) {
    // Try basic connection first, then full connection
    connectionTestPromise = testBasicConnection().then(async (basicResult) => {
      if (basicResult.success) {
        // If basic connection works, try full database connection
        const fullResult = await testConnection();
        return fullResult;
      } else {
        return basicResult;
      }
    });
  }
  return connectionTestPromise;
};

// Database types
export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          address?: string;
          phone?: string;
          email?: string;
          logo?: string;
          current_balance: number;
          total_debt: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clinics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clinics']['Insert']>;
      };
      doctors: {
        Row: {
          id: string;
          name: string;
          clinic_id: string;
          phone?: string;
          email?: string;
          photo?: string;
          current_balance: number;
          total_debt: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['doctors']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['doctors']['Insert']>;
      };
      prosthesis_types: {
        Row: {
          id: string;
          name: string;
          base_price: number;
          model_price?: number;
          category?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prosthesis_types']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['prosthesis_types']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          barcode: string;
          patient_name: string;
          doctor_id: string;
          prosthesis_type_id: string;
          status: 'waiting' | 'in-progress' | 'completed' | 'delivered';
          technician_id?: string;
          arrival_date: string;
          delivery_date: string;
          completion_date?: string;
          actual_delivery_date?: string;
          notes?: string;
          cost?: number;
          unit_count: number;
          total_price: number;
          final_price?: number;
          discount_amount?: number;
          is_paid: boolean;
          is_digital_measurement: boolean;
          is_manual_measurement: boolean;
          has_model: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      technicians: {
        Row: {
          id: string;
          name: string;
          username: string;
          password: string;
          monthly_quota: number;
          completed_jobs: number;
          salary: number;
          is_active: boolean;
          photo?: string;
          phone?: string;
          email?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['technicians']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['technicians']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          role: 'admin' | 'technician' | 'accountant';
          name: string;
          email?: string;
          phone?: string;
          is_active: boolean;
          can_view_prices: boolean;
          photo?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          date: string;
          category: string;
          description: string;
          amount: number;
          supplier?: string;
          invoice_number?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          doctor_id: string;
          order_id?: string;
          amount: number;
          date: string;
          type: 'payment' | 'debt';
          description: string;
          invoice_number?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
    };
  };
}