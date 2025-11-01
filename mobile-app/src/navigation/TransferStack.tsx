import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TransferScreen from '../screens/main/TransferScreen';
import TransferReceiptScreen from '../screens/main/TransferReceiptScreen';

const Stack = createStackNavigator();

export default function TransferStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransferMain" component={TransferScreen} />
      <Stack.Screen name="TransferReceipt" component={TransferReceiptScreen} />
    </Stack.Navigator>
  );
} 