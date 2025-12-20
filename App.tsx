import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import hDashboard from './lib/Pages/hDashboard';
import LandingPage from './lib/Pages/LandingPage';
import SignIn from './lib/Pages/SignIn';
import SignUp from './lib/Pages/SignUp';
import oDashboard from './lib/Pages/oDashboard';
import ORequest from './lib/Pages/oRequest';
import ApiConnectiontester from './lib/Pages/TestApiConnection';
import EmailVerification from './lib/Pages/EmailVerification';
import AdminPending from './lib/Pages/AdminPending';
import ForgotPassword from './lib/Pages/ForgotPassword';
import { ResponsiveProvider } from './lib/utils/ResponsiveContext';
import oMaintenance from './lib/Pages/oMaintenance';
import oAdditive from './lib/Pages/oAdditive';
import oProcess from './lib/Pages/oProcess';
import oMap from './lib/Pages/oMap';
import oWasteRecord from './lib/Pages/oWasteRecord';
import oSchedule from './lib/Pages/oSchedule';
import OAdditive from './lib/Pages/oAdditive';
import HRewards from './lib/Pages/hRewards';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ResponsiveProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="SignIn"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Landing" component={LandingPage} />
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="VerifyEmail" component={EmailVerification} />
          <Stack.Screen name="AdminPending" component={AdminPending} />
          <Stack.Screen name="HDashboard" component={hDashboard} />
          <Stack.Screen name="HRewards" component={HRewards} />
          <Stack.Screen name="ODashboard" component={oDashboard} />
          <Stack.Screen name="ORequest" component={ORequest} />
          <Stack.Screen name="oMaintenance" component={oMaintenance} />
          <Stack.Screen name="oAdditive" component={oAdditive} />
          <Stack.Screen name="oProcess" component={oProcess} />
          <Stack.Screen name="OMap" component={oMap} />
          <Stack.Screen name="OWasteRecord" component={oWasteRecord} />
          <Stack.Screen name="OSchedule" component={oSchedule} />
          <Stack.Screen name="ApiConnectiontester" component={ApiConnectiontester} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </ResponsiveProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b1212ff',
  },
});
