import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoogleSignIn } from '../src/config/googleSignIn';
import { useAuth } from '../src/context/AuthContext';

// Validation helpers
const validateEmail = (email) => {
  if (!email.trim()) return { valid: false, error: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, error: 'Please enter a valid email address' };
  return { valid: true, error: '' };
};

const validatePassword = (password) => {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  return { valid: true, error: '' };
};

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithEmail, signInWithGoogle, isLoading } = useAuth();
  const { signInWithGoogle: googleSignIn } = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loginError, setLoginError] = useState('');

  // Real-time validation
  useEffect(() => {
    if (touched.email) {
      const emailValidation = validateEmail(email);
      setErrors(prev => ({ ...prev, email: emailValidation.error }));
    }
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.password) {
      const passwordValidation = validatePassword(password);
      setErrors(prev => ({ ...prev, password: passwordValidation.error }));
    }
  }, [password, touched.password]);

  useEffect(() => {
    if (loginError) setLoginError('');
  }, [email, password]);

  const handleLogin = async () => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    setTouched({ email: true, password: true });
    setErrors({ email: emailValidation.error, password: passwordValidation.error });

    if (!emailValidation.valid || !passwordValidation.valid) return;

    setIsEmailLoading(true);
    setLoginError('');
    
    try {
      // Use AuthContext's loginWithEmail method
      const result = await loginWithEmail(email.trim().toLowerCase(), password);
      
      if (result.success) {
        router.replace('/(tabs)/home');
      } else {
        setLoginError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setLoginError('');
    
    try {
      // Use React Native-compatible Google Sign-In
      const result = await googleSignIn();
      
      if (result.success) {
        // Get Firebase ID token
        const idToken = await result.user.getIdToken();
        
        // Send to our backend to create session
        const backendResult = await signInWithGoogle(idToken);
        
        if (backendResult.success) {
          router.replace('/(tabs)/home');
        } else {
          setLoginError(backendResult.error || 'Failed to create session');
        }
      } else if (result.cancelled) {
        setLoginError('Sign-in was cancelled.');
      } else {
        setLoginError(result.error || 'Google sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setLoginError('Google sign-in failed. Please try again or use email/password.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isEmailValid = email.trim() && !errors.email;
  const isPasswordValid = password && !errors.password;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="home" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>LilyCrest</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your tenant portal</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, touched.email && errors.email && styles.inputWrapperError, touched.email && isEmailValid && styles.inputWrapperSuccess]}>
                <Ionicons name="mail-outline" size={20} color={touched.email && errors.email ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter your email" 
                  placeholderTextColor="#9CA3AF" 
                  value={email} 
                  onChangeText={setEmail} 
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))} 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                  autoCorrect={false} 
                />
                {touched.email && isEmailValid && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
              </View>
              {touched.email && errors.email ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, touched.password && errors.password && styles.inputWrapperError, touched.password && isPasswordValid && styles.inputWrapperSuccess]}>
                <Ionicons name="lock-closed-outline" size={20} color={touched.password && errors.password ? '#EF4444' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Enter your password" 
                  placeholderTextColor="#9CA3AF" 
                  value={password} 
                  onChangeText={setPassword} 
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))} 
                  secureTextEntry={!showPassword} 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {touched.password && errors.password ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              ) : null}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Error */}
            {loginError ? (
              <View style={styles.loginErrorContainer}>
                <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
                <Text style={styles.loginErrorText}>{loginError}</Text>
              </View>
            ) : null}

            {/* Sign In Button */}
            <TouchableOpacity 
              style={[styles.signInButton, (!isEmailValid || !isPasswordValid || isEmailLoading) && styles.signInButtonDisabled]} 
              onPress={handleLogin} 
              disabled={isLoading || isEmailLoading || !isEmailValid || !isPasswordValid}
            >
              {isEmailLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.signInButtonText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Sign In - Using Firebase directly */}
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleLogin} 
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#1E3A5F" />
            ) : (
              <>
                <Image 
                  source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }} 
                  style={styles.googleIcon} 
                  defaultSource={{ uri: 'https://www.google.com/favicon.ico' }}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Tenant Notice */}
          <View style={styles.noticeContainer}>
            <Ionicons name="information-circle" size={18} color="#F97316" />
            <Text style={styles.noticeText}>Only registered tenants can access this app. Contact the admin office if you need assistance.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  logoIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoText: { fontSize: 24, fontWeight: '700', color: '#1E3A5F' },
  title: { fontSize: 28, fontWeight: '700', color: '#1E3A5F', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#1E3A5F', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 16 },
  inputWrapperError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  inputWrapperSuccess: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1F2937' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  errorText: { fontSize: 12, color: '#EF4444' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { color: '#F97316', fontSize: 14, fontWeight: '600' },
  loginErrorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 },
  loginErrorText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  signInButton: { 
    backgroundColor: '#1E3A5F', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    ...Platform.select({ 
      ios: { shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, 
      android: { elevation: 4 }, 
      web: { boxShadow: '0 4px 12px rgba(30, 58, 95, 0.3)' } 
    }) 
  },
  signInButtonDisabled: { 
    backgroundColor: '#94A3B8', 
    ...Platform.select({ 
      ios: { shadowOpacity: 0 }, 
      android: { elevation: 0 }, 
      web: { boxShadow: 'none' } 
    }) 
  },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { paddingHorizontal: 16, color: '#9CA3AF', fontSize: 13 },
  googleButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1.5, 
    borderColor: '#E5E7EB', 
    borderRadius: 12, 
    paddingVertical: 14, 
    backgroundColor: '#FFFFFF', 
    gap: 12 
  },
  googleIcon: { width: 20, height: 20 },
  googleButtonText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  noticeContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF7ED', borderRadius: 12, padding: 16, marginTop: 24, gap: 10 },
  noticeText: { flex: 1, fontSize: 13, color: '#9A3412', lineHeight: 18 },
});
