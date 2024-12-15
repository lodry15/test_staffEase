import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { addDocument } from '@/lib/db/firestore';
import { validatePassword, validateEmail } from '@/lib/validations';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  general?: string;
}

export function SignUp() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else {
      // Check if email already exists in users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', formData.email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        newErrors.email = 'This email is already registered';
      }
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors[0];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form including email existence check
      const isValid = await validateForm();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.toLowerCase(), // Normalize email to lowercase
        formData.password
      );

      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase(),
        systemRole: ['admin'],
        createdAt: serverTimestamp(),
      };

      await addDocument('users', userCredential.user.uid, userData);

      // Set user in auth store
      setUser({
        id: userCredential.user.uid,
        ...userData,
      });

      // Redirect to initial setup
      navigate('/admin/initial-setup');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already registered' });
      } else {
        setErrors({ 
          general: 'Failed to create account. Please try again.' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Admin Account</h1>
          <p className="mt-2 text-sm text-gray-600">Enter your information to get started</p>
        </div>

        {errors.general && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              autoComplete="given-name"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-purple-600 hover:text-purple-500 font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}