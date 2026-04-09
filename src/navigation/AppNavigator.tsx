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
import SupplierBinPricingScreen from '../screens/SupplierBinPricingScreen';
import SupplierRequestsScreen from '../screens/SupplierRequestsScreen';
import SupplierOrderAcceptedScreen from '../screens/SupplierOrderAcceptedScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import AccountScreen from '../screens/AccountScreen';
import ServiceTrackingScreen from '../screens/ServiceTrackingScreen';
import BookingsScreen from '../screens/BookingsScreen';
import OrderBinScreen from '../screens/OrderBinScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import SupplierDriversScreen from '../screens/SupplierDriversScreen';
import DriverDashboard from '../screens/DriverDashboard';
import DriverJobsScreen from '../screens/DriverJobsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MessageInboxScreen from '../screens/MessageInboxScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import BillingScreen from '../screens/BillingScreen';

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
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="MessageInbox" component={MessageInboxScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
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
            <Stack.Screen name="SupplierBinPricing" component={SupplierBinPricingScreen} />
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
            <Stack.Screen name="SupplierDrivers" component={SupplierDriversScreen} />
            <Stack.Screen name="Bookings" component={BookingsScreen} />
            <Stack.Screen
              name="ServiceTracking"
              component={ServiceTrackingScreen}
            />
            <Stack.Screen name="Account" component={AccountScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="MessageInbox" component={MessageInboxScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
          </>
        ) : user?.role === 'driver' ? (
          <>
            <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
            <Stack.Screen name="DriverJobs" component={DriverJobsScreen} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="MessageInbox" component={MessageInboxScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
