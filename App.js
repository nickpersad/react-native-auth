import * as React from 'react';
import { AsyncStorage, StatusBar, Button, Text, TextInput, View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SafeAreaView from 'react-native-safe-area-view';

import { SERVER, SERVER_PORT } from 'react-native-dotenv';

const AuthContext = React.createContext();

function SplashScreen() {
  return (
    <View>
      <Text>Loading...</Text>
    </View>
  );
}

function HomeScreen({ route, navigation }) {
  const { signOut } = React.useContext(AuthContext);

  const { id } = route.params;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#6a51ae' }]}>
      <Text style={{ color: '#fff' }}>Signed in!!</Text>
      <Text>sessionId: {JSON.stringify(id)}</Text>
      <Button
        title="Sign out"
        onPress={signOut}
        color="#fff"
      />
    </SafeAreaView>
  );
}

function SignInScreen({route, navigation}) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const { signIn } = React.useContext(AuthContext);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#9a73ef"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9a73ef"
        value={password}
        autoCapitalize="none"
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.submitButton}
        onPress={
          () => signIn({ username, password })
        }>
        <Text style={styles.submitButtonText}> Sign in </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.signUpButton}
        onPress={
          () => navigation.navigate('SignUp')
        }>
        <Text style={styles.signUpButtonText}> Sign up </Text>
      </TouchableOpacity>
    </View>
  );
}

function SignUpScreen({route}) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const { signUp } = React.useContext(AuthContext);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#9a73ef"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9a73ef"
        value={password}
        autoCapitalize="none"
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#9a73ef"
        value={confirmPassword}
        autoCapitalize="none"
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={styles.submitButton}
        onPress={
          () => signUp({ username, password, confirmPassword })
        }>
        <Text style={styles.submitButtonText}> Sign Up </Text>
      </TouchableOpacity>
    </View>
  );
}

const Stack = createStackNavigator();

export default function App({ navigation }) {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    }
  );

  React.useEffect(() => {
    // Fetch the token from storage then navigate to our appropriate place
    const bootstrapAsync = async () => {
      let userToken;

      try {
        userToken = await AsyncStorage.getItem('userToken');
      } catch (e) {
        // Restoring token failed
      }

      // After restoring token, we may need to validate it in production apps

      // This will switch to the App screen or Auth screen and this loading
      // screen will be unmounted and thrown away.
      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async data => {
        // In a production app, we need to send some data (usually username, password) to server and get a token
        // We will also need to handle errors if sign in failed
        // After getting token, we need to persist the token using `AsyncStorage`
        // In the example, we'll use a dummy token
        const settings = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        };
        try {
          const fetchResponse = await fetch(`${SERVER}:${SERVER_PORT}/api/signin`, settings);
          const data = await fetchResponse.json();

          state.userToken = data.id;

          dispatch({ type: 'SIGN_IN', token: data.id });
        } catch (e) {
          console.error(e)
        }
      },
      signOut: async () => {
        const settings = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'accessnick@gmail.com'
          })
        };
        try {
          const fetchResponse = await fetch(`${SERVER}:${SERVER_PORT}/api/signout`, settings);
          const data = await fetchResponse;

          state.userToken = null;
          dispatch({ type: 'SIGN_OUT' })
        } catch (e) {
          console.error(e)
        }
      },
      signUp: async data => {
        const settings = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        };

        if (data.password === data.confirmPassword) {
          try {
            const fetchResponse = await fetch(`${SERVER}:${SERVER_PORT}/api/signup`, settings);
            const data = await fetchResponse.json();

            state.userToken = data.id;

            dispatch({ type: 'SIGN_UP', token: data.id });
          } catch (e) {
            console.error(e)
          }
        } else {
          console.log('password and confirm password does not match')
        }
      },
    }),
    []
  );

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator>
          {state.isLoading ? (
            // We haven't finished checking for the token yet
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : state.userToken == null ? (
            // No token found, user isn't signed in
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{
                title: 'Sign in',
                // When logging out, a pop animation feels intuitive
                animationTypeForReplace: state.isSignout ? 'pop' : 'push',
              }}
            />
          ) : (
                // User is signed in
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen}
                  initialParams={{ id: state.userToken }} 
                />
              )}
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{
              title: 'Sign up',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  input: {
    margin: 15,
    height: 40,
    width: 250,
    borderColor: '#7a42f4',
    borderWidth: 1,
    paddingLeft: 15
  },
  submitButton: {
    backgroundColor: '#7a42f4',
    padding: 10,
    margin: 15,
    height: 40,
    width: 250,
    justifyContent: 'center', 
    alignItems: 'center'
  },
  signUpButton: {
    height: 40,
    width: 250,
    justifyContent: 'center', 
    alignItems: 'center'
  },
  submitButtonText: {
    color: 'white'
  },
  signUpButtonText: {
    color: '#7a42f4'
  }
})