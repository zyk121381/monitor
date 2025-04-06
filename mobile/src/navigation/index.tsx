import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, Animated, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { navigationRef } from './navigationUtils';
import { API_BASE_URL, saveApiBaseUrl } from '../config/api';

// Screens - 只引用已实现的屏幕
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MonitorsScreen from '../screens/monitors/MonitorsScreen';
import MonitorDetailScreen from '../screens/monitors/MonitorDetailScreen';
import CreateMonitorScreen from '../screens/monitors/CreateMonitorScreen';
import AgentsScreen from '../screens/agents/AgentsScreen';
import AgentDetailScreen from '../screens/agents/AgentDetailScreen';
import CreateAgentScreen from '../screens/agents/CreateAgentScreen';
import StatusScreen from '../screens/status/StatusScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import MonitorNotificationsScreen from '../screens/settings/MonitorNotificationsScreen';
import AgentNotificationsScreen from '../screens/settings/AgentNotificationsScreen';
import GlobalSettingsScreen from '../screens/settings/GlobalSettingsScreen';
import NotificationChannelsScreen from '../screens/settings/NotificationChannelsScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Auth context
import { useAuthStore } from '../store/authStore';

// 监控导航栈
const MonitorsStack = createNativeStackNavigator();
const MonitorsNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <MonitorsStack.Navigator>
      <MonitorsStack.Screen
        name="MonitorsList"
        component={MonitorsScreen}
        options={{ title: t('navigation.monitors', '监控') }}
      />
      <MonitorsStack.Screen
        name="MonitorDetail"
        component={MonitorDetailScreen}
        options={({ route }: any) => ({ 
          title: route.params?.name || t('monitors.detail', '监控详情') 
        })}
      />
      <MonitorsStack.Screen
        name="CreateMonitor"
        component={CreateMonitorScreen}
        options={{ title: t('monitors.addMonitor', '添加监控') }}
      />
    </MonitorsStack.Navigator>
  );
};

// 客户端导航栈
const AgentsStack = createNativeStackNavigator();
const AgentsNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <AgentsStack.Navigator>
      <AgentsStack.Screen
        name="AgentsList"
        component={AgentsScreen}
        options={{ title: t('navigation.agents', '客户端') }}
      />
      <AgentsStack.Screen
        name="AgentDetail"
        component={AgentDetailScreen}
        options={({ route }: any) => ({ 
          title: route.params?.name || t('agents.detail', '客户端详情') 
        })}
      />
      <AgentsStack.Screen
        name="CreateAgent"
        component={CreateAgentScreen}
        options={{ title: t('agents.addAgent', '添加客户端') }}
      />
    </AgentsStack.Navigator>
  );
};

// 主页标签栏
const MainTab = createBottomTabNavigator();
const MainTabNavigator = () => {
  const { t } = useTranslation();
  
  const tabBarStyle = {
    height: 75,
    position: 'absolute' as const,
    bottom: 25,
    left: 20,
    right: 20,
    borderRadius: 28,
    paddingTop: 5,
    paddingBottom: 10,
    paddingHorizontal: 5,
    backgroundColor: '#ffffff',
    boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.08)',
    elevation: 10,
    borderTopWidth: 0
  };
  
  return (
    <MainTab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarShowLabel: true,
        headerShown: true,
        tabBarStyle: tabBarStyle,
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarIconStyle: {
          marginTop: 5
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 3,
          textAlign: 'center'
        },
        tabBarItemStyle: {
          flex: 1,
          paddingHorizontal: 0,
          minWidth: 60
        }
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t('navigation.dashboard', '仪表盘'),
          tabBarLabel: t('navigation.dashboard', '仪表盘'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={22} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Monitors"
        component={MonitorsNavigator}
        options={{
          title: t('navigation.monitors', '监控'),
          tabBarLabel: t('navigation.monitors', '监控'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={22} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Agents"
        component={AgentsNavigator}
        options={{
          title: t('navigation.agents', '客户端'),
          tabBarLabel: t('navigation.agents', '客户端'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip-outline" size={22} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('navigation.settings', '设置'),
          tabBarLabel: t('navigation.settings', '设置'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
};

// 根导航
const RootStack = createNativeStackNavigator();
const RootNavigator = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const { isAuthenticated, checkAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const prevAuthState = React.useRef(false);
  
  // 初始检查认证状态
  React.useEffect(() => {
    const checkAuth = async () => {
      await checkAuthenticated();
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // 监听认证状态变化
  React.useEffect(() => {
    // 如果状态从认证变为未认证
    if (prevAuthState.current && !isAuthenticated && !isLoading) {
      console.log('认证状态从true变为false，手动处理导航');
      
      setTimeout(() => {
        if (navigationRef.isReady()) {
          try {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'Login' }]
            });
            console.log('导航手动重置成功');
          } catch (e) {
            console.error('导航手动重置失败', e);
          }
        } else {
          console.log('导航容器未就绪，无法执行手动重置');
        }
      }, 300);
    }
    
    // 记录当前状态，用于下次比较
    prevAuthState.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          <RootStack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="Status" 
            component={StatusScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="GlobalSettings" 
            component={GlobalSettingsScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="NotificationChannels" 
            component={NotificationChannelsScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="MonitorNotifications" 
            component={MonitorNotificationsScreen}
            options={{
              headerShown: false
            }}
          />
          <RootStack.Screen 
            name="AgentNotifications" 
            component={AgentNotificationsScreen}
            options={{
              headerShown: false
            }}
          />
        </>
      ) : (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
};

// 导航容器
const AppNavigator = ({ initialApiConfigured }: { initialApiConfigured: boolean | null }) => {
  const colorScheme = useColorScheme();
  const [apiUrlSettingsVisible, setApiUrlSettingsVisible] = React.useState(!initialApiConfigured);
  
  // 如果API基础URL未配置，先显示设置模态框
  if (apiUrlSettingsVisible) {
    return (
      <NavigationContainer ref={navigationRef}>
        <SafeAreaProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <ApiUrlSetupScreen onComplete={() => setApiUrlSettingsVisible(false)} />
        </SafeAreaProvider>
      </NavigationContainer>
    );
  }
  
  return (
    <NavigationContainer ref={navigationRef}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </SafeAreaProvider>
    </NavigationContainer>
  );
};

// 添加API URL配置屏幕组件
interface ApiUrlSetupScreenProps {
  onComplete: () => void;
}

const ApiUrlSetupScreen: React.FC<ApiUrlSetupScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [apiUrl, setApiUrl] = React.useState(API_BASE_URL);
  const [saving, setSaving] = React.useState(false);
  
  const handleSave = async () => {
    try {
      setSaving(true);
      await saveApiBaseUrl(apiUrl);
      
      // 标记API URL已配置
      await AsyncStorage.setItem('api_url_configured', 'true');
      
      setSaving(false);
      onComplete();
    } catch (error) {
      console.error(t('settings.apiUrlSaveFailed'), error);
      setSaving(false);
    }
  };
  
  return (
    <View style={styles.setupContainer}>
      <View style={styles.setupContent}>
        <Text style={styles.setupTitle}>{t('setup.welcome')}</Text>
        <Text style={styles.setupSubtitle}>{t('setup.firstTimeSetup')}</Text>
        
        <Text style={styles.setupLabel}>{t('settings.apiBaseUrl')}</Text>
        <TextInput
          style={styles.setupInput}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="http://..."
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        
        <Text style={styles.setupHelper}>
          {t('settings.apiHelperText')}
        </Text>
        
        <TouchableOpacity 
          style={styles.setupButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.setupButtonText}>
              {t('setup.continue')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 添加相关样式
const styles = StyleSheet.create({
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  setupContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  setupLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  setupInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  setupHelper: {
    fontSize: 12,
    color: '#666',
    marginBottom: 32,
    lineHeight: 18,
  },
  setupButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppNavigator; 