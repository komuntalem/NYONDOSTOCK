// Form Validation Module
const FormValidator = {
  // Validation rules
  rules: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, or apostrophes'
    },
    phone: {
      required: true,
      pattern: /^(07|06|05)\d{8}$/,
      message: 'Phone must be a valid Ugandan number (07/06/05 followed by 8 digits)'
    },
    email: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    nin: {
      required: false,
      minLength: 7,
      maxLength: 20,
      message: 'NIN must be between 7-20 characters'
    },
    password: {
      required: true,
      minLength: 6,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must be at least 6 characters with uppercase, lowercase, and number'
    },
    amount: {
      required: true,
      pattern: /^\d+(\.\d{1,2})?$/,
      message: 'Amount must be a valid number'
    },
    date: {
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      message: 'Please enter a valid date (YYYY-MM-DD)'
    }
  },

  // Validate a single field
  validateField(fieldName, value) {
    const rule = this.rules[fieldName];
    if (!rule) return { valid: true, error: '' };

    // Check required
    if (rule.required && (!value || value.trim() === '')) {
      return {
        valid: false,
        error: `${this.capitalize(fieldName)} is required`
      };
    }

    // If not required and empty, skip other validations
    if (!rule.required && (!value || value.trim() === '')) {
      return { valid: true, error: '' };
    }

    // Check minLength
    if (rule.minLength && value.length < rule.minLength) {
      return {
        valid: false,
        error: `${this.capitalize(fieldName)} must be at least ${rule.minLength} characters`
      };
    }

    // Check maxLength
    if (rule.maxLength && value.length > rule.maxLength) {
      return {
        valid: false,
        error: `${this.capitalize(fieldName)} must not exceed ${rule.maxLength} characters`
      };
    }

    // Check pattern
    if (rule.pattern && !rule.pattern.test(value)) {
      return {
        valid: false,
        error: rule.message || `${this.capitalize(fieldName)} format is invalid`
      };
    }

    return { valid: true, error: '' };
  },

  // Validate entire form
  validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input, textarea, select');
    let isValid = true;
    const errors = {};

    inputs.forEach(input => {
      if (input.name && this.rules[input.name]) {
        const result = this.validateField(input.name, input.value);
        if (!result.valid) {
          isValid = false;
          errors[input.name] = result.error;
          this.showFieldError(input, result.error);
        } else {
          this.clearFieldError(input);
        }
      }
    });

    return { isValid, errors };
  },

  // Show error message under field
  showFieldError(input, message) {
    this.clearFieldError(input);
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback d-block';
    errorDiv.textContent = message;
    input.parentElement.appendChild(errorDiv);
  },

  // Clear error message
  clearFieldError(input) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');

    const errorDiv = input.parentElement.querySelector('.invalid-feedback');
    if (errorDiv) errorDiv.remove();
  },

  // Capitalize helper
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Real-time validation on input
  attachRealTimeValidation(formElement) {
    const inputs = formElement.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.name && this.rules[input.name]) {
        input.addEventListener('blur', () => {
          const result = this.validateField(input.name, input.value);
          if (!result.valid) {
            this.showFieldError(input, result.error);
          } else {
            this.clearFieldError(input);
          }
        });

        // Clear error on focus
        input.addEventListener('focus', () => {
          this.clearFieldError(input);
        });
      }
    });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form');
  if (form) {
    // Real-time validation
    FormValidator.attachRealTimeValidation(form);

    // Submit validation
    form.addEventListener('submit', function(e) {
      const validation = FormValidator.validateForm(form);
      if (!validation.isValid) {
        e.preventDefault();
        console.log('Form validation errors:', validation.errors);
      }
    });
  }
});
