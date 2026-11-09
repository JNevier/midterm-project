import React, { useId } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginSchema } from '../../utils/validationSchemas';
import Logo from '../../components/Logo';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  useDocumentTitle('Log in | StudySpot PH');
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  });

  // Go back to the page that sent the visitor here, or Home
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

  const fieldId = useId();
  const fieldA11y = (name) => (
    errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `${fieldId}-${name}-error` }
      : { 'aria-invalid': false }
  );

  return (
    <div className="login-page container">
      <div className="login-card ss-card">
        <div className="login-card__intro">
          <Logo size={48} />
          <h1 className="login-card__title">Log in to StudySpot PH</h1>
          <p className="text-muted mb-0">Demo login: enter any name and a valid email.</p>
        </div>

        {/* noValidate: the messages below come from the form rules, shown inline */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-3">
            <label htmlFor={`${fieldId}-name`} className="form-label">Full name</label>
            <input
              id={`${fieldId}-name`}
              type="text"
              autoComplete="name"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              {...register('name')}
              {...fieldA11y('name')}
            />
            {errors.name && (
              <div id={`${fieldId}-name-error`} className="invalid-feedback">{errors.name.message}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor={`${fieldId}-email`} className="form-label">Email address</label>
            <input
              id={`${fieldId}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              {...register('email')}
              {...fieldA11y('email')}
            />
            {errors.email && (
              <div id={`${fieldId}-email-error`} className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
