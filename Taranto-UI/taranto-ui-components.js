// src/components/Button.jsx
import React from 'react';

/**
 * Button Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {'turquoise'|'green'|'orange'|'red'|'grey'} props.color - Button color
 * @param {'small'|'medium'} props.size - Button size
 * @param {React.ReactNode} props.icon - Icon element (from lucide-react)
 * @param {boolean} props.disabled - Disabled state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional classes
 */
export const Button = ({ 
  children, 
  color = 'turquoise', 
  size = 'medium', 
  icon, 
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const colorClasses = {
    turquoise: 'bg-taranto-turquoise hover:bg-taranto-turquoise/90',
    green: 'bg-taranto-green hover:bg-taranto-green/90',
    orange: 'bg-taranto-orange hover:bg-taranto-orange/90',
    red: 'bg-taranto-red hover:bg-taranto-red/90',
    grey: 'bg-taranto-grey hover:bg-taranto-grey/90'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 
        rounded-lg font-medium font-roboto
        text-white transition-all duration-200
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

// src/components/Input.jsx
/**
 * Input Component
 * 
 * @param {Object} props
 * @param {string} props.placeholder - Placeholder text
 * @param {'text'|'email'|'password'|'tel'|'date'} props.type - Input type
 * @param {'outlined'|'filled'|'underline'} props.variant - Input style
 * @param {React.ReactNode} props.icon - Icon element
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.error - Error state
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 */
export const Input = ({ 
  placeholder, 
  type = 'text', 
  variant = 'outlined',
  icon, 
  disabled = false, 
  error = false,
  value,
  onChange,
  className = '',
  ...props 
}) => {
  const variantClasses = {
    outlined: 'border-2 border-gray-300 rounded-lg bg-white focus:border-taranto-turquoise',
    filled: 'border-0 bg-gray-100 rounded-lg focus:bg-white',
    underline: 'border-0 border-b-2 border-gray-300 rounded-none focus:border-taranto-turquoise bg-transparent'
  };

  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className={`
          px-4 py-2 w-full font-roboto
          transition-all duration-200 outline-none
          ${icon ? 'pl-10' : ''}
          ${variantClasses[variant]}
          ${error ? 'border-taranto-red' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

// src/components/Card.jsx
/**
 * Card Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {'elevated'|'outlined'|'flat'} props.variant - Card style
 * @param {boolean} props.hover - Enable hover effect
 * @param {string} props.className - Additional classes
 */
export const Card = ({ 
  children, 
  variant = 'elevated', 
  hover = false,
  className = '',
  ...props 
}) => {
  const variantClasses = {
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
    flat: 'bg-gray-50'
  };

  return (
    <div
      className={`
        rounded-lg p-4
        ${variantClasses[variant]}
        ${hover ? 'transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// src/components/Badge.jsx
/**
 * Badge Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {'turquoise'|'green'|'orange'|'red'|'grey'} props.color - Badge color
 * @param {'small'|'medium'|'large'} props.size - Badge size
 * @param {'rounded'|'pill'} props.shape - Badge shape
 * @param {'filled'|'outlined'} props.variant - Badge variant
 */
export const Badge = ({ 
  children, 
  color = 'turquoise', 
  size = 'medium',
  shape = 'rounded',
  variant = 'filled',
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base'
  };

  const shapeClasses = {
    rounded: 'rounded-lg',
    pill: 'rounded-full'
  };

  const colorClasses = {
    turquoise: variant === 'filled' 
      ? 'bg-taranto-turquoise text-white' 
      : 'border-2 border-taranto-turquoise text-taranto-turquoise',
    green: variant === 'filled' 
      ? 'bg-taranto-green text-white' 
      : 'border-2 border-taranto-green text-taranto-green',
    orange: variant === 'filled' 
      ? 'bg-taranto-orange text-white' 
      : 'border-2 border-taranto-orange text-taranto-orange',
    red: variant === 'filled' 
      ? 'bg-taranto-red text-white' 
      : 'border-2 border-taranto-red text-taranto-red',
    grey: variant === 'filled' 
      ? 'bg-taranto-grey text-white' 
      : 'border-2 border-taranto-grey text-taranto-grey'
  };

  return (
    <span
      className={`
        inline-block font-medium font-roboto
        ${sizeClasses[size]}
        ${shapeClasses[shape]}
        ${colorClasses[color]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

// src/components/Switch.jsx
/**
 * Switch Component
 * 
 * @param {Object} props
 * @param {boolean} props.checked - Checked state
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Label text
 * @param {boolean} props.disabled - Disabled state
 */
export const Switch = ({ 
  checked = false, 
  onChange, 
  label, 
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative w-12 h-6 rounded-full transition-colors
          ${checked ? 'bg-taranto-turquoise' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div
          className={`
            absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
            ${checked ? 'transform translate-x-6' : ''}
          `}
        />
      </div>
      {label && (
        <span className="font-roboto text-taranto-grey">{label}</span>
      )}
    </label>
  );
};

// src/components/Checkbox.jsx
/**
 * Checkbox Component
 * 
 * @param {Object} props
 * @param {boolean} props.checked - Checked state
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Label text
 * @param {boolean} props.disabled - Disabled state
 */
export const Checkbox = ({ 
  checked = false, 
  onChange, 
  label, 
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
          ${checked 
            ? 'border-taranto-turquoise bg-taranto-turquoise' 
            : 'border-gray-300 bg-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {checked && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {label && (
        <span className="font-roboto text-taranto-grey">{label}</span>
      )}
    </label>
  );
};

// src/components/Radio.jsx
/**
 * Radio Component
 * 
 * @param {Object} props
 * @param {boolean} props.checked - Checked state
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Label text
 * @param {boolean} props.disabled - Disabled state
 */
export const Radio = ({ 
  checked = false, 
  onChange, 
  label, 
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <div
        onClick={() => !disabled && onChange()}
        className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
          ${checked ? 'border-taranto-turquoise' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {checked && (
          <div className="w-2.5 h-2.5 rounded-full bg-taranto-turquoise" />
        )}
      </div>
      {label && (
        <span className="font-roboto text-taranto-grey">{label}</span>
      )}
    </label>
  );
};

// src/components/Progress.jsx
/**
 * Progress Component
 * 
 * @param {Object} props
 * @param {number} props.value - Current value (0-100)
 * @param {number} props.max - Maximum value (default 100)
 * @param {'turquoise'|'green'|'orange'} props.color - Progress color
 * @param {boolean} props.showLabel - Show percentage label
 * @param {'small'|'medium'|'large'} props.size - Progress bar size
 */
export const Progress = ({ 
  value = 0, 
  max = 100, 
  color = 'turquoise',
  showLabel = true,
  size = 'medium',
  className = '',
  ...props 
}) => {
  const percentage = Math.round((value / max) * 100);

  const sizeClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3'
  };

  const colorClasses = {
    turquoise: 'bg-taranto-turquoise',
    green: 'bg-taranto-green',
    orange: 'bg-taranto-orange'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-roboto text-taranto-grey">Progress</span>
          <span className={`text-sm font-semibold font-roboto text-taranto-${color}`}>
            {percentage}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Export all components
export * from './Button';
export * from './Input';
export * from './Card';
export * from './Badge';
export * from './Switch';
export * from './Checkbox';
export * from './Radio';
export * from './Progress';