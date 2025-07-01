import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { Send, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { sendSupportEmail, createSupportEmailContent, isValidEmail } from '@/services/emailService';

interface EmailFormProps {
  onBack: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EmailForm: React.FC<EmailFormProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: 'Bean Journal Support Request',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear submit status when user makes changes
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const emailContent = createSupportEmailContent(formData.message, {
        name: formData.name,
        email: formData.email
      });

      const result = await sendSupportEmail({
        to: 'support@beanjournal.site',
        subject: formData.subject,
        message: emailContent,
        userEmail: formData.email,
        userName: formData.name
      });

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message
        });
        
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          subject: 'Bean Journal Support Request',
          message: ''
        });
        
        // Call success callback if provided
        onSuccess?.();
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = () => {
    if (formData.message.trim()) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    } else {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in the message before resending.'
      });
    }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to menu</span>
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-lg mb-2 text-blue-800">Contact Support</h3>
          <p className="text-blue-700 text-sm">
            Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Status Messages */}
        {submitStatus.type && (
          <div className={`p-4 rounded-lg border flex items-center space-x-2 ${
            submitStatus.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {submitStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm">{submitStatus.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your full name"
              className={errors.name ? 'border-red-300 focus:border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className={errors.email ? 'border-red-300 focus:border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Subject Field */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief description of your issue"
              className={errors.subject ? 'border-red-300 focus:border-red-500' : ''}
            />
            {errors.subject && (
              <p className="text-red-600 text-xs mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Message Field */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Please describe your issue or question in detail..."
              rows={5}
              className={errors.message ? 'border-red-300 focus:border-red-500' : ''}
            />
            {errors.message && (
              <p className="text-red-600 text-xs mt-1">{errors.message}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col space-y-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </Button>
            
            {submitStatus.type === 'success' && (
              <Button
                type="button"
                onClick={handleResend}
                disabled={isSubmitting}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Another Message</span>
              </Button>
            )}
          </div>
        </form>

        {/* Help Text */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-xs">
            <strong>Note:</strong> We typically respond within 24 hours during business days. 
            For urgent issues, please include "URGENT" in your subject line.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailForm;