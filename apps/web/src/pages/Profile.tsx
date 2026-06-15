import { useState, useEffect, useRef } from 'react'
import { gql, useQuery, useMutation } from 'urql'

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      displayName
      bio
      avatarUrl
      yearsEmpty
      numberOfKids
      interests
      profileVisibility
      createdAt
    }
  }
`

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      displayName
      bio
      avatarUrl
      yearsEmpty
      numberOfKids
      interests
      profileVisibility
    }
  }
`

const CREATE_PROFILE_MUTATION = gql`
  mutation CreateProfile($input: CreateProfileInput!) {
    createProfile(input: $input) {
      id
      displayName
      bio
      yearsEmpty
      numberOfKids
      interests
    }
  }
`

const REQUEST_AVATAR_UPLOAD = gql`
  mutation RequestAvatarUpload($contentType: String!) {
    requestAvatarUpload(contentType: $contentType) {
      url
      key
      publicUrl
    }
  }
`

const CONFIRM_AVATAR_UPLOAD = gql`
  mutation ConfirmAvatarUpload($publicUrl: String!) {
    confirmAvatarUpload(publicUrl: $publicUrl)
  }
`

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public', description: 'Visible to everyone' },
  { value: 'NEST_MEMBERS', label: 'Nest Members', description: 'Only people in your nests' },
  { value: 'PARTNER_GROUP', label: 'Partner Group', description: 'Only your partner group' },
  { value: 'PRIVATE', label: 'Private', description: 'Only you' },
]

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '640px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: '#1a1a1a',
  },
  subheading: {
    fontSize: '0.95rem',
    color: '#666',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e8e8e8',
    background: '#fafafa',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.25rem',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  avatarPreview: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '3px solid #e8f5e9',
  },
  avatarPlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#e8f5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#2d6a4f',
    border: '3px solid #e8f5e9',
  },
  avatarControls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  avatarButton: {
    padding: '0.4rem 0.8rem',
    borderRadius: '5px',
    border: '1px solid #2d6a4f',
    background: 'transparent',
    color: '#2d6a4f',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  avatarHint: {
    fontSize: '0.75rem',
    color: '#888',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
  },
  fieldRow: {
    display: 'flex',
    gap: '1rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#333',
  },
  input: {
    padding: '0.6rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
  },
  textarea: {
    padding: '0.6rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.95rem',
    outline: 'none',
    minHeight: '100px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    width: '100%',
  },
  select: {
    padding: '0.6rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.95rem',
    outline: 'none',
    background: '#fff',
    width: '100%',
  },
  button: {
    padding: '0.75rem 2rem',
    borderRadius: '6px',
    border: 'none',
    background: '#2d6a4f',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start' as const,
  },
  buttonDisabled: {
    padding: '0.75rem 2rem',
    borderRadius: '6px',
    border: 'none',
    background: '#a0a0a0',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'not-allowed',
    alignSelf: 'flex-start' as const,
  },
  loading: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '1rem',
  },
  error: {
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    background: '#fdecea',
    color: '#c62828',
    fontSize: '0.9rem',
  },
  success: {
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    background: '#e8f5e9',
    color: '#2d6a4f',
    fontSize: '0.9rem',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#888',
  },
  memberSince: {
    fontSize: '0.85rem',
    color: '#888',
    marginTop: '1rem',
    textAlign: 'center' as const,
  },
  uploading: {
    fontSize: '0.8rem',
    color: '#2d6a4f',
    fontStyle: 'italic' as const,
  },
}

interface FormState {
  displayName: string
  bio: string
  yearsEmpty: string
  numberOfKids: string
  interests: string
  profileVisibility: string
}

export function Profile() {
  const [result, reexecuteMe] = useQuery({ query: ME_QUERY })
  const [, updateProfile] = useMutation(UPDATE_PROFILE_MUTATION)
  const [, createProfile] = useMutation(CREATE_PROFILE_MUTATION)
  const [, requestUpload] = useMutation(REQUEST_AVATAR_UPLOAD)
  const [, confirmUpload] = useMutation(CONFIRM_AVATAR_UPLOAD)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    displayName: '',
    bio: '',
    yearsEmpty: '',
    numberOfKids: '',
    interests: '',
    profileVisibility: 'NEST_MEMBERS',
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const { data, fetching, error } = result
  const isNewProfile = data?.me && !data.me.displayName

  useEffect(() => {
    if (data?.me && data.me.displayName) {
      setForm({
        displayName: data.me.displayName || '',
        bio: data.me.bio || '',
        yearsEmpty: data.me.yearsEmpty != null ? String(data.me.yearsEmpty) : '',
        numberOfKids: data.me.numberOfKids != null ? String(data.me.numberOfKids) : '',
        interests: Array.isArray(data.me.interests) ? data.me.interests.join(', ') : '',
        profileVisibility: data.me.profileVisibility || 'NEST_MEMBERS',
      })
      if (data.me.avatarUrl) {
        setAvatarPreview(data.me.avatarUrl)
      }
    }
  }, [data])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSuccessMessage('')
    setSubmitError('')
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setSubmitError('Please select a JPEG, PNG, WebP, or GIF image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Image must be under 5MB.')
      return
    }

    setUploadingAvatar(true)
    setSubmitError('')

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)

    try {
      // 1. Get presigned URL from API
      const { data: uploadData, error: uploadError } = await requestUpload({
        contentType: file.type,
      })

      if (uploadError || !uploadData?.requestAvatarUpload) {
        throw new Error(uploadError?.message || 'Failed to get upload URL')
      }

      const { url, publicUrl } = uploadData.requestAvatarUpload

      // 2. Upload file directly to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      // 3. Confirm upload with API (updates user record)
      const { error: confirmError } = await confirmUpload({ publicUrl })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      setAvatarPreview(publicUrl)
      setSuccessMessage('Avatar updated!')
      reexecuteMe({ requestPolicy: 'network-only' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Avatar upload failed')
      // Revert preview
      setAvatarPreview(data?.me?.avatarUrl || null)
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMessage('')
    setSubmitError('')

    const interests = form.interests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const input = {
      displayName: form.displayName,
      bio: form.bio || undefined,
      yearsEmpty: form.yearsEmpty ? Number(form.yearsEmpty) : undefined,
      numberOfKids: form.numberOfKids ? Number(form.numberOfKids) : undefined,
      interests: interests.length > 0 ? interests : undefined,
      ...(isNewProfile ? {} : { profileVisibility: form.profileVisibility }),
    }

    const result = isNewProfile ? await createProfile({ input }) : await updateProfile({ input })

    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error.message)
    } else {
      setSuccessMessage(isNewProfile ? 'Profile created!' : 'Profile updated!')
      reexecuteMe({ requestPolicy: 'network-only' })
    }
  }

  function getInitials(name: string | undefined | null): string {
    if (!name) return '?'
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (fetching) {
    return <div style={styles.loading}>Loading profile...</div>
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Failed to load profile: {error.message}</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>{isNewProfile ? 'Complete Your Profile' : 'Your Profile'}</h1>
      <p style={styles.subheading}>
        {isNewProfile
          ? 'Tell us about yourself so others in your nests can get to know you.'
          : 'Manage your profile information and preferences.'}
      </p>

      {successMessage && (
        <div style={{ ...styles.success, marginBottom: '1rem' }}>{successMessage}</div>
      )}
      {submitError && <div style={{ ...styles.error, marginBottom: '1rem' }}>{submitError}</div>}

      <form style={styles.form} onSubmit={handleSubmit}>
        {/* Avatar Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Profile Photo</div>
          <div style={styles.avatarSection}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" style={styles.avatarPreview} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {getInitials(form.displayName || data?.me?.email)}
              </div>
            )}
            <div style={styles.avatarControls}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                style={styles.avatarButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Uploading...' : avatarPreview ? 'Change Photo' : 'Upload Photo'}
              </button>
              <span style={styles.avatarHint}>JPEG, PNG, WebP, or GIF. Max 5MB.</span>
              {uploadingAvatar && <span style={styles.uploading}>Uploading to cloud...</span>}
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Basic Info</div>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="displayName">
              Display Name *
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              style={styles.input}
              value={form.displayName}
              onChange={handleChange}
              placeholder="How you'd like to be known"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="bio">
              About You
            </label>
            <textarea
              id="bio"
              name="bio"
              style={styles.textarea}
              value={form.bio}
              onChange={handleChange}
              placeholder="Share a bit about yourself, your interests, what you're looking forward to..."
            />
          </div>
        </div>

        {/* Empty Nester Details */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Empty Nester Details</div>
          <div style={styles.fieldRow}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label} htmlFor="yearsEmpty">
                Years as Empty Nester
              </label>
              <input
                id="yearsEmpty"
                name="yearsEmpty"
                type="number"
                min="0"
                max="50"
                style={styles.input}
                value={form.yearsEmpty}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label} htmlFor="numberOfKids">
                Number of Kids
              </label>
              <input
                id="numberOfKids"
                name="numberOfKids"
                type="number"
                min="0"
                max="20"
                style={styles.input}
                value={form.numberOfKids}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="interests">
              Interests
            </label>
            <input
              id="interests"
              name="interests"
              type="text"
              style={styles.input}
              value={form.interests}
              onChange={handleChange}
              placeholder="hiking, cooking, travel, photography"
            />
            <span style={styles.hint}>
              Comma-separated. Helps match you with activities and nests.
            </span>
          </div>
        </div>

        {/* Privacy Section (only for existing profiles) */}
        {!isNewProfile && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Privacy</div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="profileVisibility">
                Who can see your profile?
              </label>
              <select
                id="profileVisibility"
                name="profileVisibility"
                style={styles.select}
                value={form.profileVisibility}
                onChange={handleChange}
              >
                {VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploadingAvatar}
          style={submitting || uploadingAvatar ? styles.buttonDisabled : styles.button}
        >
          {submitting ? 'Saving...' : isNewProfile ? 'Create Profile' : 'Save Changes'}
        </button>
      </form>

      {data?.me?.createdAt && !isNewProfile && (
        <p style={styles.memberSince}>
          Member since{' '}
          {new Date(data.me.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
