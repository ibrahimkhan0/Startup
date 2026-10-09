import { useState } from 'react'
import { INDUSTRIES, FUNDING_STAGES } from '../utils/constants'

const MAX_FUNDING = 1_000_000_000_000

// Mirrors the server rules in startupRoutes.js. Returns { field: message }.
// An empty object means every field passed.
function validateForm(values) {
  const errors = {}

  if (!values.name?.trim()) errors.name = 'Name is required'
  else if (values.name.trim().length > 100) errors.name = 'Name cannot exceed 100 characters'

  if (!values.tagline?.trim()) errors.tagline = 'Tagline is required'
  else if (values.tagline.trim().length > 150) errors.tagline = 'Tagline cannot exceed 150 characters'

  if (!values.description?.trim()) errors.description = 'Description is required'
  else if (values.description.trim().length < 10) errors.description = 'Description must be at least 10 characters'
  else if (values.description.trim().length > 2000) errors.description = 'Description cannot exceed 2000 characters'

  if (!values.industry) errors.industry = 'Industry is required'
  else if (!INDUSTRIES.includes(values.industry)) errors.industry = 'Invalid industry'

  if (!values.fundingStage) errors.fundingStage = 'Funding stage is required'
  else if (!FUNDING_STAGES.includes(values.fundingStage)) errors.fundingStage = 'Invalid funding stage'

  // Check for empty BEFORE Number(), because Number('') is 0 and would pass.
  if (values.fundingRequired === '' || values.fundingRequired == null) {
    errors.fundingRequired = 'Funding required is required'
  } else {
    const num = Number(values.fundingRequired)
    if (Number.isNaN(num)) errors.fundingRequired = 'Funding required must be a number'
    else if (num < 0) errors.fundingRequired = 'Funding required cannot be negative'
    else if (num > MAX_FUNDING) errors.fundingRequired = 'Funding required exceeds the maximum allowed value'
  }

  if (!values.location?.trim()) errors.location = 'Location is required'
  else if (values.location.trim().length > 100) errors.location = 'Location cannot exceed 100 characters'

  // Optional, but if present it must be an http(s) URL (blocks javascript: links).
  if (values.website && values.website.trim()) {
    try {
      const url = new URL(values.website.trim())
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.website = 'Website must start with http:// or https://'
      }
    } catch {
      errors.website = 'Website must start with http:// or https://'
    }
  }

  return errors
}

// Defined OUTSIDE StartupForm on purpose. If it were declared inside, React would
// treat it as a new component on every render and inputs would lose focus.
function Field({ name, label, error, required, children }) {
  const id = `field-${name}`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const inputClass = (hasError) =>
  `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
  }`

// Props:
//   initialData  - values to pre-fill (edit page) or {} (create page). Only read on the
//                  first render, so the edit page must render the form AFTER the data loads.
//   onSubmit     - fn(values) called after client validation passes
//   isLoading    - disables the button and shows a spinner
//   serverErrors - [{ field, message }] from a 422 response
//   submitLabel  - button text
export default function StartupForm({
  initialData = {},
  onSubmit,
  isLoading = false,
  serverErrors = [],
  submitLabel = 'Submit',
}) {
  const [values, setValues] = useState({
    name: initialData.name ?? '',
    tagline: initialData.tagline ?? '',
    description: initialData.description ?? '',
    industry: initialData.industry ?? '',
    fundingStage: initialData.fundingStage ?? '',
    fundingRequired: initialData.fundingRequired != null ? String(initialData.fundingRequired) : '',
    location: initialData.location ?? '',
    website: initialData.website ?? '',
  })
  const [clientErrors, setClientErrors] = useState({})
  // Fields the user has edited since the last submit. Their server errors are hidden,
  // so a red message disappears as soon as the user starts fixing that field.
  const [editedFields, setEditedFields] = useState({})

  const visibleServerErrors = {}
  for (const { field, message } of serverErrors) {
    if (!editedFields[field]) visibleServerErrors[field] = message
  }
  const errors = { ...visibleServerErrors, ...clientErrors }

  const fieldProps = (name) => ({
    id: `field-${name}`,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `field-${name}-error` : undefined,
  })

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setEditedFields((prev) => ({ ...prev, [field]: true }))
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (isLoading) return // ignore double submits

    const errs = validateForm(values)
    setClientErrors(errs) // also clears old errors when everything is valid
    if (Object.keys(errs).length > 0) return

    setEditedFields({})
    onSubmit({
      name: values.name.trim(),
      tagline: values.tagline.trim(),
      description: values.description.trim(),
      industry: values.industry,
      fundingStage: values.fundingStage,
      fundingRequired: Number(values.fundingRequired),
      location: values.location.trim(),
      website: values.website.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field name="name" label="Company name" error={errors.name} required>
        <input
          {...fieldProps('name')}
          type="text"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          maxLength={100}
          className={inputClass(!!errors.name)}
          placeholder="e.g. Acme Labs"
        />
      </Field>

      <Field name="tagline" label="Tagline" error={errors.tagline} required>
        <input
          {...fieldProps('tagline')}
          type="text"
          value={values.tagline}
          onChange={(e) => handleChange('tagline', e.target.value)}
          maxLength={150}
          className={inputClass(!!errors.tagline)}
          placeholder="One sentence on what you do"
        />
      </Field>

      <Field name="description" label="Description" error={errors.description} required>
        <textarea
          {...fieldProps('description')}
          value={values.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={5}
          maxLength={2000}
          className={inputClass(!!errors.description)}
          placeholder="Your product, traction and vision (10 to 2000 characters)"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field name="industry" label="Industry" error={errors.industry} required>
          <select
            {...fieldProps('industry')}
            value={values.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            className={inputClass(!!errors.industry)}
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </Field>

        <Field name="fundingStage" label="Funding stage" error={errors.fundingStage} required>
          <select
            {...fieldProps('fundingStage')}
            value={values.fundingStage}
            onChange={(e) => handleChange('fundingStage', e.target.value)}
            className={inputClass(!!errors.fundingStage)}
          >
            <option value="">Select stage</option>
            {FUNDING_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field name="fundingRequired" label="Funding required (USD)" error={errors.fundingRequired} required>
        <input
          {...fieldProps('fundingRequired')}
          type="number"
          value={values.fundingRequired}
          onChange={(e) => handleChange('fundingRequired', e.target.value)}
          min={0}
          max={MAX_FUNDING}
          step={1000}
          className={inputClass(!!errors.fundingRequired)}
          placeholder="e.g. 500000"
        />
      </Field>

      <Field name="location" label="Location" error={errors.location} required>
        <input
          {...fieldProps('location')}
          type="text"
          value={values.location}
          onChange={(e) => handleChange('location', e.target.value)}
          maxLength={100}
          className={inputClass(!!errors.location)}
          placeholder="e.g. Bengaluru, India"
        />
      </Field>

      <Field name="website" label="Website (optional)" error={errors.website}>
        <input
          {...fieldProps('website')}
          type="url"
          value={values.website}
          onChange={(e) => handleChange('website', e.target.value)}
          maxLength={200}
          className={inputClass(!!errors.website)}
          placeholder="https://example.com"
        />
      </Field>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          )}
          {isLoading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
