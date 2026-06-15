import { useState } from 'react'
import { gql, useQuery, useMutation } from 'urql'

const MY_TESTIMONIALS_QUERY = gql`
  query MyTestimonials {
    myTestimonials {
      id
      body
      visibility
      approvalStatus
      createdAt
      nest {
        id
        name
      }
    }
  }
`

const MY_NESTS_QUERY = gql`
  query MyNestsForTestimonial {
    myNests {
      id
      nest {
        id
        name
      }
    }
  }
`

const CREATE_TESTIMONIAL_MUTATION = gql`
  mutation CreateTestimonial($input: CreateTestimonialInput!) {
    createTestimonial(input: $input) {
      id
      body
      visibility
      approvalStatus
    }
  }
`

const UPDATE_TESTIMONIAL_MUTATION = gql`
  mutation UpdateTestimonial($testimonialId: String!, $input: UpdateTestimonialInput!) {
    updateTestimonial(testimonialId: $testimonialId, input: $input) {
      id
      body
      visibility
      approvalStatus
    }
  }
`

const DELETE_TESTIMONIAL_MUTATION = gql`
  mutation DeleteTestimonial($testimonialId: String!) {
    deleteTestimonial(testimonialId: $testimonialId)
  }
`

const VISIBILITY_OPTIONS = [
  { value: 'USER_PRIVATE', label: 'Private (only you)' },
  { value: 'FAMILY_PRIVATE', label: 'Family only' },
  { value: 'NEST_PRIVATE', label: 'Nest members only' },
  { value: 'PUBLIC', label: 'Public' },
]

const VISIBILITY_HELP: Record<string, string> = {
  USER_PRIVATE: 'Only you can see this testimonial.',
  FAMILY_PRIVATE: 'Visible to your family/partner group.',
  NEST_PRIVATE: 'Visible to members of the selected nest.',
  PUBLIC: 'Visible to everyone on the platform.',
}

interface Testimonial {
  id: string
  body: string
  visibility: string
  approvalStatus: string
  createdAt: string
  nest: { id: string; name: string } | null
}

interface NestMembership {
  id: string
  nest: { id: string; name: string }
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '700px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 600,
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    marginBottom: '1rem',
    marginTop: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
    background: '#e8f5e9',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#333',
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
  },
  select: {
    padding: '0.6rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.95rem',
    outline: 'none',
    background: '#fff',
  },
  button: {
    padding: '0.7rem 1.5rem',
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
    padding: '0.7rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    background: '#a0a0a0',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'not-allowed',
    alignSelf: 'flex-start' as const,
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #c62828',
    background: '#fff',
    color: '#c62828',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #666',
    background: '#fff',
    color: '#666',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1.25rem',
    marginBottom: '1rem',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  cardBody: {
    fontSize: '0.95rem',
    color: '#333',
    marginBottom: '0.75rem',
    lineHeight: 1.5,
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    fontSize: '0.8rem',
  },
  badge: {
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  badgePending: {
    background: '#fff8e1',
    color: '#f57f17',
  },
  badgeApproved: {
    background: '#e8f5e9',
    color: '#2d6a4f',
  },
  badgeRejected: {
    background: '#fdecea',
    color: '#c62828',
  },
  badgeVisibility: {
    background: '#e3f2fd',
    color: '#1565c0',
  },
  loading: {
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '1rem',
  },
  error: {
    padding: '1rem',
    borderRadius: '6px',
    background: '#fdecea',
    color: '#c62828',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  success: {
    padding: '1rem',
    borderRadius: '6px',
    background: '#e8f5e9',
    color: '#2d6a4f',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#888',
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
  date: {
    fontSize: '0.8rem',
    color: '#888',
  },
}

function getApprovalBadgeStyle(status: string) {
  switch (status) {
    case 'APPROVED':
      return { ...styles.badge, ...styles.badgeApproved }
    case 'REJECTED':
      return { ...styles.badge, ...styles.badgeRejected }
    default:
      return { ...styles.badge, ...styles.badgePending }
  }
}

export function Testimonials() {
  const [testimonialsResult, refetchTestimonials] = useQuery({ query: MY_TESTIMONIALS_QUERY })
  const [nestsResult] = useQuery({ query: MY_NESTS_QUERY })

  const [, createTestimonial] = useMutation(CREATE_TESTIMONIAL_MUTATION)
  const [, updateTestimonial] = useMutation(UPDATE_TESTIMONIAL_MUTATION)
  const [, deleteTestimonial] = useMutation(DELETE_TESTIMONIAL_MUTATION)

  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [nestId, setNestId] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editVisibility, setEditVisibility] = useState('')
  const [updating, setUpdating] = useState(false)
  const [editError, setEditError] = useState('')

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const testimonials: Testimonial[] = testimonialsResult.data?.myTestimonials ?? []
  const nests: NestMembership[] = nestsResult.data?.myNests ?? []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return

    setCreating(true)
    setCreateError('')

    const input: { body: string; visibility: string; nestId?: string } = {
      body: body.trim(),
      visibility,
    }
    if (visibility === 'NEST_PRIVATE' && nestId) {
      input.nestId = nestId
    }

    const result = await createTestimonial({ input })
    setCreating(false)

    if (result.error) {
      setCreateError(result.error.message)
    } else {
      setBody('')
      setVisibility('PUBLIC')
      setNestId('')
      refetchTestimonials({ requestPolicy: 'network-only' })
    }
  }

  function startEdit(testimonial: Testimonial) {
    setEditingId(testimonial.id)
    setEditBody(testimonial.body)
    setEditVisibility(testimonial.visibility)
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditBody('')
    setEditVisibility('')
    setEditError('')
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editBody.trim()) return

    setUpdating(true)
    setEditError('')

    const result = await updateTestimonial({
      testimonialId: editingId,
      input: { body: editBody.trim(), visibility: editVisibility },
    })
    setUpdating(false)

    if (result.error) {
      setEditError(result.error.message)
    } else {
      cancelEdit()
      refetchTestimonials({ requestPolicy: 'network-only' })
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    const result = await deleteTestimonial({ testimonialId: id })
    setDeleting(false)
    setDeleteConfirmId(null)

    if (!result.error) {
      refetchTestimonials({ requestPolicy: 'network-only' })
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function truncateBody(text: string, maxLen = 120) {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen).trimEnd() + '…'
  }

  if (testimonialsResult.fetching) {
    return <div style={styles.loading}>Loading testimonials…</div>
  }

  if (testimonialsResult.error) {
    return (
      <div style={styles.error}>Error loading testimonials: {testimonialsResult.error.message}</div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Testimonials</h1>

      {/* Create form */}
      <h2 style={styles.sectionTitle}>Write a Testimonial</h2>
      <form style={styles.form} onSubmit={handleCreate}>
        {createError && <div style={styles.error}>{createError}</div>}

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Your testimonial</label>
          <textarea
            style={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience…"
            required
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Visibility</label>
          <select
            style={styles.select}
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value)
              if (e.target.value !== 'NEST_PRIVATE') setNestId('')
            }}
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span style={styles.hint}>{VISIBILITY_HELP[visibility]}</span>
        </div>

        {visibility === 'NEST_PRIVATE' && (
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Nest</label>
            <select
              style={styles.select}
              value={nestId}
              onChange={(e) => setNestId(e.target.value)}
            >
              <option value="">Select a nest…</option>
              {nests.map((m) => (
                <option key={m.nest.id} value={m.nest.id}>
                  {m.nest.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          style={creating || !body.trim() ? styles.buttonDisabled : styles.button}
          disabled={creating || !body.trim()}
        >
          {creating ? 'Submitting…' : 'Submit Testimonial'}
        </button>
      </form>

      {/* Testimonial list */}
      <h2 style={styles.sectionTitle}>Your Testimonials</h2>
      {testimonials.length === 0 && (
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          You haven't written any testimonials yet.
        </p>
      )}

      {testimonials.map((t) =>
        editingId === t.id ? (
          <form
            key={t.id}
            style={{ ...styles.form, background: '#fff', border: '2px solid #2d6a4f' }}
            onSubmit={handleUpdate}
          >
            {editError && <div style={styles.error}>{editError}</div>}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Edit testimonial</label>
              <textarea
                style={styles.textarea}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Visibility</label>
              <select
                style={styles.select}
                value={editVisibility}
                onChange={(e) => setEditVisibility(e.target.value)}
              >
                {VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span style={styles.hint}>{VISIBILITY_HELP[editVisibility]}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={updating || !editBody.trim() ? styles.buttonDisabled : styles.button}
                disabled={updating || !editBody.trim()}
              >
                {updating ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" style={styles.cancelButton} onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div key={t.id} style={styles.card} onClick={() => startEdit(t)}>
            <div style={styles.cardBody}>{truncateBody(t.body)}</div>
            <div style={styles.cardMeta}>
              <span style={{ ...styles.badge, ...styles.badgeVisibility }}>
                {VISIBILITY_OPTIONS.find((o) => o.value === t.visibility)?.label ?? t.visibility}
              </span>
              <span style={getApprovalBadgeStyle(t.approvalStatus)}>{t.approvalStatus}</span>
              {t.nest && (
                <span style={{ fontSize: '0.8rem', color: '#555' }}>Nest: {t.nest.name}</span>
              )}
              <span style={styles.date}>{formatDate(t.createdAt)}</span>
            </div>
            <div style={styles.cardActions}>
              {deleteConfirmId === t.id ? (
                <>
                  <span style={{ fontSize: '0.85rem', color: '#c62828' }}>Delete?</span>
                  <button
                    style={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(t.id)
                    }}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Confirm'}
                  </button>
                  <button
                    style={styles.cancelButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmId(null)
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  style={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirmId(t.id)
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  )
}
