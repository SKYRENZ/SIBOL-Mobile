import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HDashboard from './lib/Pages/hDashboard';
import LandingPage from './lib/Pages/LandingPage';
import SignIn from './lib/Pages/SignIn';
import SignUp from './lib/Pages/SignUp';
import ODashboard from './lib/Pages/oDashboard';
import ORequest from './lib/Pages/oRequest';
import ApiConnectiontester from './lib/Pages/TestApiConnection';
import EmailVerification from './lib/Pages/EmailVerification';
import AdminPending from './lib/Pages/AdminPending';
import ForgotPassword from './lib/Pages/ForgotPassword';
import { ResponsiveProvider } from './lib/utils/ResponsiveContext';
import { MenuProvider } from './lib/components/MenuProvider';
import OMaintenance from './lib/Pages/oMaintenance';
import OAdditive from './lib/Pages/oAdditive';
import OProcess from './lib/Pages/oProcess';
import OMap from './lib/Pages/oMap';
import OWasteRecord from './lib/Pages/oWasteRecord';
import OSchedule from './lib/Pages/oSchedule';
import HRewards from './lib/Pages/hRewards';
import HHistory from './lib/Pages/hHistory';
import HNotifications from './lib/Pages/hNotifications';
import ONotifications from './lib/Pages/oNotifications';
import ChatSupport from './lib/Pages/ChatSupport';
import ChatIntro from './lib/Pages/ChatIntro';
import WiFiConnectivity from './lib/Pages/WiFiConnectivity';
import OProfile from './lib/Pages/oProfile';
import HProfile from './lib/Pages/hProfile';
import HProfileEdit from './lib/Pages/hProfileEdit';
import HMap from './lib/Pages/hMap';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ResponsiveProvider>
      <NavigationContainer>
        <MenuProvider>
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
          <Stack.Screen name="HDashboard" component={HDashboard} />
          <Stack.Screen name="HMap" component={HMap} />
          <Stack.Screen name="HRewards" component={HRewards} />
          <Stack.Screen name="HHistory" component={HHistory} />
          <Stack.Screen name="HNotifications" component={HNotifications} />
          <Stack.Screen name="ONotifications" component={ONotifications} />
          <Stack.Screen name="ODashboard" component={ODashboard} />
          <Stack.Screen name="ORequest" component={ORequest} />
          <Stack.Screen name="OMaintenance" component={OMaintenance} />
          <Stack.Screen name="OAdditive" component={OAdditive} />
          <Stack.Screen name="OProcess" component={OProcess} />
          <Stack.Screen name="OMap" component={OMap} />
          <Stack.Screen name="OWasteRecord" component={OWasteRecord} />
          <Stack.Screen name="OSchedule" component={OSchedule} />
          <Stack.Screen name="ChatSupport" component={ChatSupport} />
          <Stack.Screen name="ChatIntro" component={ChatIntro} />
          <Stack.Screen name="OProfile" component={OProfile} />
          <Stack.Screen name="HProfile" component={HProfile} />
          <Stack.Screen name="HProfileEdit" component={HProfileEdit} />
          <Stack.Screen name="ApiConnectiontester" component={ApiConnectiontester} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="WiFiConnectivity" component={WiFiConnectivity} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </MenuProvider>
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
