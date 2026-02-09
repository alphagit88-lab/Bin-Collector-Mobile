import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CustomerDashboard from '../screens/CustomerDashboard';
import SupplierDashboard from '../screens/SupplierDashboard';
import SupplierJobsScreen from '../screens/SupplierJobsScreen';
import SupplierEarningsScreen from '../screens/SupplierEarningsScreen';
import SupplierOperationsScreen from '../screens/SupplierOperationsScreen';
import FleetManagementScreen from '../screens/FleetManagementScreen';
import SupplierAvailabilityScreen from '../screens/SupplierAvailabilityScreen';
import ServiceAreaScreen from '../screens/ServiceAreaScreen';
import SupplierRequestsScreen from '../screens/SupplierRequestsScreen';
import SupplierOrderAcceptedScreen from '../screens/SupplierOrderAcceptedScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import AccountScreen from '../screens/AccountScreen';
import ServiceTrackingScreen from '../screens/ServiceTrackingScreen';
import BookingsScreen from '../screens/BookingsScreen';
import OrderBinScreen from '../screens/OrderBinScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';

import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : user?.role === 'customer' ? (
          <>
            <Stack.Screen
              name="CustomerDashboard"
              component={CustomerDashboard}
            />
            <Stack.Screen name="OrderBin" component={OrderBinScreen} />
            <Stack.Screen
              name="OrderConfirmation"
              component={OrderConfirmationScreen}
            />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
            <Stack.Screen name="Bookings" component={BookingsScreen} />
            <Stack.Screen
              name="ServiceTracking"
              component={ServiceTrackingScreen}
            />
            <Stack.Screen name="Account" component={AccountScreen} />
          </>
        ) : user?.role === 'supplier' ? (
          <>
            <Stack.Screen
              name="SupplierDashboard"
              component={SupplierDashboard}
            />
            <Stack.Screen
              name="SupplierOperations"
              component={SupplierOperationsScreen}
            />
            <Stack.Screen
              name="SupplierAvailability"
              component={SupplierAvailabilityScreen}
            />
            <Stack.Screen
              name="FleetManagement"
              component={FleetManagementScreen}
            />
            <Stack.Screen
              name="SupplierRequests"
              component={SupplierRequestsScreen}
            />
            <Stack.Screen name="ServiceArea" component={ServiceAreaScreen} />
            <Stack.Screen
              name="SupplierOrderAccepted"
              component={SupplierOrderAcceptedScreen}
            />
            <Stack.Screen name="SupplierJobs" component={SupplierJobsScreen} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
            <Stack.Screen
              name="SupplierEarnings"
              component={SupplierEarningsScreen}
            />
            <Stack.Screen name="Bookings" component={BookingsScreen} />
            <Stack.Screen
              name="ServiceTracking"
              component={ServiceTrackingScreen}
            />
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
