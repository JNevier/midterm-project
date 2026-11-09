import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginSchema } from '../../utils/validationSchemas';
import { FaSignInAlt, FaUser, FaEnvelope } from 'react-icons/fa';

const Login = () => {
  const { login } = useAuth();
  useDocumentTitle('Log in | StudySpot PH');
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  });

  // Always redirect to home after login instead of dashboard
  const from = location.state?.from?.pathname || '/';

  const onSubmit = (data) => {
    const userData = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      loginTime: new Date().toISOString()
    };

    login(userData);
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <FaSignInAlt size={40} className="text-primary mb-3" />
                  <h2 className="card-title">Login to StudySpot PH</h2>
                  <p className="text-muted">Enter your details to continue</p>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label className="form-label">
                      <FaUser className="me-2" /> Full Name
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      {...register('name')}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name.message}</div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label">
                      <FaEnvelope className="me-2" /> Email Address
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      {...register('email')}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email.message}</div>
                    )}
                  </div>
                  
                  <button type="submit" className="btn btn-primary w-100 py-2">
                    <FaSignInAlt className="me-2" /> Login
                  </button>
                </form>
                
                <div className="text-center mt-4">
                  <small className="text-muted">
                    This is a simulated login for demonstration purposes.
                    Any valid name and email format will work.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;