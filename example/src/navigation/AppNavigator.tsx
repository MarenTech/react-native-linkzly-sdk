import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DeepLinkRouter from './DeepLinkRouter';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ProductsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{title: 'Products'}}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{title: 'Product Details'}}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer
      ref={ref => {
        if (ref) {
          DeepLinkRouter.setNavigationRef(ref);
        }
      }}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2196f3',
          tabBarInactiveTintColor: '#999',
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="Products"
          component={ProductsStack}
          options={{
            title: 'Products',
            tabBarLabel: 'Products',
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
