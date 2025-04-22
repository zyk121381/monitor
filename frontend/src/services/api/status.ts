import api from './index';
import { 
  StatusPageConfig,
  StatusPageConfigResponse,
  StatusPageData
} from '../../types/status';

// 获取状态页配置
export const getStatusPageConfig = async (): Promise<{
  success: boolean;
  message?: string;
  config?: StatusPageConfigResponse;
}> => {
  try {
    const response = await api.get<{
      success: boolean;
      message?: string;
      config?: StatusPageConfigResponse;
    }>('/api/status/config');
    return response.data;
  } catch (error) {
    console.error('获取状态页配置失败:', error);
    return {
      success: false,
      message: '获取状态页配置失败'
    };
  }
};

// 保存状态页配置
export const saveStatusPageConfig = async (config: StatusPageConfig): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    console.log('API请求 - 保存状态页配置：', config);
    
    const response = await api.post<{
      success: boolean;
      message?: string;
    }>('/api/status/config', config);
    
    console.log('API响应 - 保存状态页配置：', response);
    
    return response.data;
  } catch (error) {
    console.error('保存状态页配置失败:', error);
    console.log('API错误详情:', {
      error,
      config
    });
    
    return {
      success: false,
      message: '保存状态页配置失败'
    };
  }
};

// 获取状态页数据
export const getStatusPageData = async (): Promise<{
  success: boolean;
  message?: string;
  data?: StatusPageData;
}> => {
  try {
    console.log('开始请求状态页数据...');
    const response = await api.get('/api/status/data');
    console.log('状态页数据响应:', response.data);
    
    // 后端返回 { success: true, data: {...} } 格式
    const { success, data, message } = response.data;
    
    if (success && data) {
      console.log('返回成功的状态数据:', data);
      
      // 确保监控和客户端数据存在
      const processedData = {
        ...data,
        monitors: data.monitors || [],
        agents: data.agents || []
      };
      
      return {
        success: true,
        data: processedData as StatusPageData
      };
    } else {
      console.error('获取状态页数据失败:', message);
      return {
        success: false,
        message: message || '获取状态页数据失败'
      };
    }
  } catch (error) {
    console.error('获取状态页数据失败:', error);
    return {
      success: false,
      message: '获取状态页数据失败'
    };
  }
}; 