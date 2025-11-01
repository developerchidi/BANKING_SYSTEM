// Environment configurations for different locations/networks
// Dễ dàng chuyển đổi giữa các môi trường khác nhau

export const ENVIRONMENTS = {
  // Môi trường ở nhà (LAN)
  HOME: {
    name: 'Home Network',
    baseUrl: 'http://192.168.1.100:3001',
    description: 'Mạng LAN ở nhà'
  },
  
  // Môi trường ở công ty (LAN)
  OFFICE: {
    name: 'Office Network', 
    baseUrl: 'http://10.0.0.50:3001',
    description: 'Mạng LAN ở công ty'
  },
  
  // Môi trường hiện tại (đang dùng)
  CURRENT: {
    name: 'Current Network',
    baseUrl: 'http://192.168.2.160:3001',
    description: 'Mạng hiện tại'
  },
  
  // Localhost (development)
  LOCAL: {
    name: 'Local Development',
    baseUrl: 'http://localhost:3001',
    description: 'Development trên máy local'
  },
  
  // Production (khi deploy)
  PRODUCTION: {
    name: 'Production',
    baseUrl: 'https://api.bankingsystem.com',
    description: 'Server production'
  }
};

// Chọn môi trường hiện tại
export const CURRENT_ENVIRONMENT = ENVIRONMENTS.CURRENT;

// Helper function để chuyển đổi môi trường
export const switchEnvironment = (envKey: keyof typeof ENVIRONMENTS) => {
  console.log(`🔄 Switching to environment: ${ENVIRONMENTS[envKey].name}`);
  console.log(`📍 Base URL: ${ENVIRONMENTS[envKey].baseUrl}`);
  return ENVIRONMENTS[envKey];
};

// Helper function để test kết nối
export const testConnection = async (baseUrl: string) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`❌ Connection test failed for ${baseUrl}:`, error);
    return false;
  }
};

// Helper function để list tất cả môi trường
export const listEnvironments = () => {
  console.log('🌍 Available Environments:');
  Object.entries(ENVIRONMENTS).forEach(([key, env]) => {
    console.log(`  ${key}: ${env.name} - ${env.baseUrl}`);
  });
}; 