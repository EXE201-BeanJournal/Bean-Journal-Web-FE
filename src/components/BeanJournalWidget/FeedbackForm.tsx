import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Submitting feedback:', feedback);

      toast.success("Feedback Submitted", { 
        description: "Thank you for your feedback! We appreciate you helping us improve."
      });
      setFeedback('');

    } catch (error) {
      console.error('Feedback submission failed', error);
      toast.error("Error", { 
        description: "Failed to submit feedback. Please try again later." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-blue-800 mb-2">Have feedback?</h3>
      <p className="text-sm text-blue-700 mb-3">We'd love to hear it. Let us know how we can improve the Bean Journal AI assistant.</p>
      <Textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Your detailed feedback..."
        className="mb-3 bg-white border-blue-300 focus:ring-blue-500"
        rows={4}
      />
      <Button onClick={handleSubmit} disabled={!feedback.trim() || isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </div>
  );
};

export default FeedbackForm;