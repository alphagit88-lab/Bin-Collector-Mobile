import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CustomerDashboard from '../screens/CustomerDashboard';
import SupplierDashboard from '../screens/SupplierDashboard';
import AccountScreen from '../screens/AccountScreen';
import ServiceTrackingScreen from '../screens/ServiceTrackingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : user?.role === 'customer' ? (
          <>
            <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
            <Stack.Screen name="ServiceTracking" component={ServiceTrackingScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
          </>
        ) : user?.role === 'supplier' ? (
          <>
            <Stack.Screen name="SupplierDashboard" component={SupplierDashboard} />
            <Stack.Screen name="ServiceTracking" component={ServiceTrackingScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
