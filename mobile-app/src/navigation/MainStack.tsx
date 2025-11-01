import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/main/DashboardScreen';
import AccountsScreen from '../screens/main/AccountsScreen';
import TransferStack from './TransferStack';
import PaymentsScreen from '../screens/main/PaymentsScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainStack() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'home';
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Accounts') iconName = focused ? 'wallet' : 'wallet-outline';
          if (route.name === 'Transfer') iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          if (route.name === 'Payments') iconName = focused ? 'card' : 'card-outline';
          if (route.name === 'Transactions') iconName = focused ? 'time' : 'time-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Accounts" component={AccountsScreen} options={{ tabBarLabel: 'Tài khoản' }} />
      <Tab.Screen name="Transfer" component={TransferStack} options={{ tabBarLabel: 'Chuyển tiền' }} />
      <Tab.Screen name="Payments" component={PaymentsScreen} options={{ tabBarLabel: 'Thanh toán' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ tabBarLabel: 'Lịch sử' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
} 