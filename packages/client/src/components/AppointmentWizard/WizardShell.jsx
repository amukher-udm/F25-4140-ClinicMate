import './WizardShell.css';
import { useAppointmentFlow } from '../../state/AppointmentContext.jsx';

const labels = {
  provider: 'Select Provider',
  visitType: 'Choose Visit Type',
  slot: 'Pick Time',
  review: 'Confirm Details',
  confirmation: 'Done',
};

export default function WizardShell({ children, title, subtitle, onBack }) {
  const { steps, currentIndex, canGoBack, actions } = useAppointmentFlow();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (canGoBack) actions.prevStep();
  };

  return (
    <div className="wizard-shell">
      <header className="wizard-header">
        <div>
          {title && <h1>{title}</h1>}
          {subtitle && <p className="wizard-subtitle">{subtitle}</p>}
        </div>
        <button
          className="wizard-back-btn"
          onClick={handleBack}
          disabled={!canGoBack && !onBack}
        >
          Back
        </button>
      </header>

      <ol className="wizard-steps" aria-label="Appointment steps">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          return (
            <li
              key={step}
              className={[
                'wizard-step',
                isActive ? 'active' : '',
                isComplete ? 'complete' : '',
              ].join(' ')}
            >
              <span className="step-index">{index + 1}</span>
              <div>
                <p className="step-title">{labels[step] || step}</p>
                {isActive && <span className="step-status">In progress</span>}
                {isComplete && <span className="step-status">Done</span>}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="wizard-content">{children}</section>
    </div>
  );
}
