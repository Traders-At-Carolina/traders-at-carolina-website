import { useState, type FormEvent } from 'react'
import { CheckCircle2, LoaderCircle } from 'lucide-react'

type FormValues = {
  fullName: string
  email: string
  graduationYear: string
  academicProgram: string
  interests: string[]
  message: string
  consent: boolean
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  fullName: '',
  email: '',
  graduationYear: '',
  academicProgram: '',
  interests: [],
  message: '',
  consent: false,
}

const interestOptions = ['Markets', 'Data & code', 'Modeling', 'Research', 'Competitions', 'Community']

const validate = (values: FormValues): FormErrors => {
  const errors: FormErrors = {}
  if (!values.fullName.trim()) errors.fullName = 'Enter your full name.'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (!values.graduationYear) errors.graduationYear = 'Select your graduation year.'
  if (!values.academicProgram.trim()) errors.academicProgram = 'Enter your major or academic program.'
  if (!values.interests.length) errors.interests = 'Choose at least one area of interest.'
  if (!values.consent) errors.consent = 'Confirm that we may send you club updates.'
  return errors
}

const storageKey = 'tac-interest-submissions'

export function InterestForm() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'duplicate' | 'error'>('idle')
  const currentYear = new Date().getFullYear()
  const graduationYears = Array.from({ length: 10 }, (_, index) => String(currentYear + index))

  const toggleInterest = (interest: string) => {
    setValues((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setStatus('idle')
    if (Object.keys(nextErrors).length) return

    setStatus('submitting')
    await new Promise((resolve) => window.setTimeout(resolve, 550))

    try {
      const existing = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as string[]
      const normalizedEmail = values.email.trim().toLowerCase()
      if (existing.includes(normalizedEmail)) {
        setStatus('duplicate')
        return
      }
      window.localStorage.setItem(storageKey, JSON.stringify([...existing, normalizedEmail]))
      setStatus('success')
      setValues(initialValues)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="form-success" role="status">
        <CheckCircle2 aria-hidden="true" />
        <h3>Prototype form validated</h3>
        <p>
          No interest submission was sent. This prototype saved only a local duplicate-check marker in this browser;
          a secure submission service must be connected before launch.
        </p>
        <button className="text-button" type="button" onClick={() => setStatus('idle')}>
          Submit another response
        </button>
      </div>
    )
  }

  return (
    <form className="interest-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="full-name">Full name</label>
          <input
            id="full-name"
            name="fullName"
            autoComplete="name"
            value={values.fullName}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'full-name-error' : undefined}
            onChange={(event) => setValues({ ...values, fullName: event.target.value })}
          />
          {errors.fullName ? <span id="full-name-error" className="field-error">{errors.fullName}</span> : null}
        </div>
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
          />
          {errors.email ? <span id="email-error" className="field-error">{errors.email}</span> : null}
        </div>
        <div className="field-group">
          <label htmlFor="graduation-year">Graduation year</label>
          <select
            id="graduation-year"
            name="graduationYear"
            value={values.graduationYear}
            aria-invalid={Boolean(errors.graduationYear)}
            aria-describedby={errors.graduationYear ? 'graduation-year-error' : undefined}
            onChange={(event) => setValues({ ...values, graduationYear: event.target.value })}
          >
            <option value="">Select a year</option>
            {graduationYears.map((year) => <option key={year}>{year}</option>)}
          </select>
          {errors.graduationYear ? <span id="graduation-year-error" className="field-error">{errors.graduationYear}</span> : null}
        </div>
        <div className="field-group">
          <label htmlFor="academic-program">Major or academic program</label>
          <input
            id="academic-program"
            name="academicProgram"
            value={values.academicProgram}
            aria-invalid={Boolean(errors.academicProgram)}
            aria-describedby={errors.academicProgram ? 'academic-program-error' : undefined}
            onChange={(event) => setValues({ ...values, academicProgram: event.target.value })}
          />
          {errors.academicProgram ? <span id="academic-program-error" className="field-error">{errors.academicProgram}</span> : null}
        </div>
      </div>

      <fieldset className="interest-options" aria-describedby={errors.interests ? 'interests-error' : undefined}>
        <legend>Areas of interest</legend>
        <div className="checkbox-grid">
          {interestOptions.map((interest) => (
            <label key={interest} className="checkbox-option">
              <input
                type="checkbox"
                checked={values.interests.includes(interest)}
                onChange={() => toggleInterest(interest)}
              />
              <span>{interest}</span>
            </label>
          ))}
        </div>
        {errors.interests ? <span id="interests-error" className="field-error">{errors.interests}</span> : null}
      </fieldset>

      <div className="field-group">
        <label htmlFor="message">Anything else you want us to know? <span>(optional)</span></label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={values.message}
          onChange={(event) => setValues({ ...values, message: event.target.value })}
        />
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={values.consent}
          aria-describedby={errors.consent ? 'consent-error' : undefined}
          onChange={(event) => setValues({ ...values, consent: event.target.checked })}
        />
        <span>I agree to receive recruitment and club updates from Traders at Carolina.</span>
      </label>
      {errors.consent ? <span id="consent-error" className="field-error">{errors.consent}</span> : null}

      {status === 'duplicate' ? (
        <div className="form-message form-message-warning" role="alert">
          This email already submitted the prototype interest form. Use a different email or wait for recruitment updates.
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="form-message form-message-error" role="alert">
          Your response could not be saved in this browser. Check your privacy settings and try again.
        </div>
      ) : null}

      <div className="form-submit-row">
        <button className="button" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? (
            <>
              <LoaderCircle className="spin" size={18} aria-hidden="true" />
              Submitting
            </>
          ) : 'Submit interest'}
        </button>
        <p>No verified mailing integration is connected in this structural prototype.</p>
      </div>
    </form>
  )
}
