import { useState } from 'react'
import { useQuery, useMutation, gql } from 'urql'

// --------------- GraphQL Operations ---------------

const ACTIVITIES_QUERY = gql`
  query Activities($category: String, $search: String) {
    activities(category: $category, search: $search) {
      id
      title
      description
      category
      imageUrl
      difficulty
      estimatedDuration
      status
    }
  }
`

const MY_BOOKMARKS_QUERY = gql`
  query MyBookmarks {
    myBookmarks {
      id
      activity {
        id
        title
        category
      }
      createdAt
    }
  }
`

const MY_ACTIVITY_INSTANCES_QUERY = gql`
  query MyActivityInstances($status: InstanceStatus) {
    myActivityInstances(status: $status) {
      id
      status
      startedAt
      completedAt
      activity {
        id
        title
        category
      }
    }
  }
`

const MY_NESTS_QUERY = gql`
  query MyNestsForActivity {
    myNests {
      id
      nest {
        id
        name
      }
      role
    }
  }
`

const MY_PARTNER_GROUPS_QUERY = gql`
  query MyPartnerGroupsForActivity {
    myPartnerGroups {
      id
      name
    }
  }
`

const BOOKMARK_ACTIVITY_MUTATION = gql`
  mutation BookmarkActivity($activityId: String!) {
    bookmarkActivity(activityId: $activityId) {
      id
      title
    }
  }
`

const CREATE_ACTIVITY_INSTANCE_MUTATION = gql`
  mutation CreateActivityInstance($input: CreateActivityInstanceInput!) {
    createActivityInstance(input: $input) {
      id
      status
    }
  }
`

const UPDATE_INSTANCE_STATUS_MUTATION = gql`
  mutation UpdateInstanceStatus($instanceId: String!, $status: InstanceStatus!) {
    updateInstanceStatus(instanceId: $instanceId, status: $status) {
      id
      status
    }
  }
`

const RATE_ACTIVITY_INSTANCE_MUTATION = gql`
  mutation RateActivityInstance($instanceId: String!, $score: Int!, $comment: String) {
    rateActivityInstance(instanceId: $instanceId, score: $score, comment: $comment) {
      id
      score
      comment
    }
  }
`

// --------------- Constants ---------------

const CATEGORIES = [
  'All',
  'Travel',
  'Fitness',
  'Creative',
  'Social',
  'Learning',
  'Outdoor',
  'Culinary',
  'Wellness',
]

// --------------- Styles ---------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#2d6a4f',
  },
  tabs: {
    display: 'flex',
    gap: '0',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #e0e0e0',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#666',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
  },
  tabActive: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#2d6a4f',
    borderBottom: '2px solid #2d6a4f',
    marginBottom: '-2px',
  },
  searchRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: '0.6rem 1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
    outline: 'none',
  },
  filters: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
  },
  filterBtn: {
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    border: '1px solid #2d6a4f',
    background: '#fff',
    color: '#2d6a4f',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  filterBtnActive: {
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    border: '1px solid #2d6a4f',
    background: '#2d6a4f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
    position: 'relative' as const,
    background: '#fff',
  },
  cardImage: {
    width: '100%',
    height: '140px',
    background: '#e8f5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    objectFit: 'cover' as const,
  },
  cardBody: {
    padding: '1rem',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: '0 0 0.25rem',
  },
  cardMeta: {
    fontSize: '0.8rem',
    color: '#666',
    margin: '0 0 0.5rem',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#444',
    margin: '0 0 0.75rem',
    lineHeight: 1.4,
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  bookmarkBtn: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    padding: '0.4rem 0.9rem',
    borderRadius: '4px',
    border: 'none',
    background: '#2d6a4f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  // Modal / overlay
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '10px',
    padding: '2rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
  },
  modalTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#2d6a4f',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 500,
    marginBottom: '0.3rem',
    color: '#333',
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
  },
  textarea: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
    resize: 'vertical' as const,
    minHeight: '60px',
  },
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  submitBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    background: '#2d6a4f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  instanceCard: {
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '1rem',
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  instanceInfo: {
    flex: 1,
  },
  instanceTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: '0 0 0.25rem',
  },
  instanceMeta: {
    fontSize: '0.8rem',
    color: '#666',
    margin: 0,
  },
  instanceActions: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap' as const,
  },
  actionBtn: {
    padding: '0.35rem 0.7rem',
    borderRadius: '4px',
    border: '1px solid #2d6a4f',
    background: '#fff',
    color: '#2d6a4f',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  starRow: {
    display: 'flex',
    gap: '0.25rem',
    marginBottom: '0.5rem',
  },
  starBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: '#888',
    fontSize: '0.95rem',
  },
  loadingState: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  errorState: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#c62828',
    fontSize: '0.9rem',
  },
  difficultyTag: {
    fontSize: '0.75rem',
    color: '#2d6a4f',
    background: '#e8f5e9',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 500,
  },
}

// --------------- Helpers ---------------

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { bg: string; color: string }> = {
    PLANNED: { bg: '#e3f2fd', color: '#1565c0' },
    IN_PROGRESS: { bg: '#fff3e0', color: '#e65100' },
    DONE: { bg: '#e8f5e9', color: '#2d6a4f' },
    ABANDONED: { bg: '#fce4ec', color: '#b71c1c' },
  }
  const c = colors[status] || { bg: '#eee', color: '#333' }
  return { ...styles.badge, background: c.bg, color: c.color }
}

// --------------- Component ---------------

export function Activities() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my'>('catalog')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [startModalActivityId, setStartModalActivityId] = useState<string | null>(null)
  const [startContext, setStartContext] = useState<{ type: 'nest' | 'partner'; id: string }>({
    type: 'nest',
    id: '',
  })
  const [ratingInstanceId, setRatingInstanceId] = useState<string | null>(null)
  const [ratingScore, setRatingScore] = useState(0)
  const [ratingComment, setRatingComment] = useState('')

  // Queries
  const [activitiesResult, _refetchActivities] = useQuery({
    query: ACTIVITIES_QUERY,
    variables: {
      category: selectedCategory === 'All' ? null : selectedCategory,
      search: searchTerm || null,
    },
  })

  const [bookmarksResult, refetchBookmarks] = useQuery({ query: MY_BOOKMARKS_QUERY })

  const [instancesResult, refetchInstances] = useQuery({
    query: MY_ACTIVITY_INSTANCES_QUERY,
    variables: { status: null },
  })

  const [nestsResult] = useQuery({ query: MY_NESTS_QUERY })
  const [partnerGroupsResult] = useQuery({ query: MY_PARTNER_GROUPS_QUERY })

  // Mutations
  const [, bookmarkActivity] = useMutation(BOOKMARK_ACTIVITY_MUTATION)
  const [, createActivityInstance] = useMutation(CREATE_ACTIVITY_INSTANCE_MUTATION)
  const [, updateInstanceStatus] = useMutation(UPDATE_INSTANCE_STATUS_MUTATION)
  const [, rateActivityInstance] = useMutation(RATE_ACTIVITY_INSTANCE_MUTATION)

  // Derived state
  const bookmarkedIds = new Set(
    (bookmarksResult.data?.myBookmarks ?? []).map(
      (b: { activity: { id: string } }) => b.activity.id,
    ),
  )
  const activities = activitiesResult.data?.activities ?? []
  const instances = instancesResult.data?.myActivityInstances ?? []
  const nests = nestsResult.data?.myNests ?? []
  const partnerGroups = partnerGroupsResult.data?.myPartnerGroups ?? []

  // Handlers
  async function handleBookmarkToggle(activityId: string) {
    await bookmarkActivity({ activityId })
    refetchBookmarks({ requestPolicy: 'network-only' })
  }

  function openStartModal(activityId: string) {
    setStartModalActivityId(activityId)
    setStartContext({ type: 'nest', id: '' })
  }

  async function handleStartActivity() {
    if (!startModalActivityId || !startContext.id) return
    const input: Record<string, string> = { activityId: startModalActivityId }
    if (startContext.type === 'nest') {
      input.nestId = startContext.id
    } else {
      input.partnerGroupId = startContext.id
    }
    await createActivityInstance({ input })
    setStartModalActivityId(null)
    refetchInstances({ requestPolicy: 'network-only' })
  }

  async function handleUpdateStatus(instanceId: string, status: string) {
    await updateInstanceStatus({ instanceId, status })
    refetchInstances({ requestPolicy: 'network-only' })
  }

  async function handleSubmitRating() {
    if (!ratingInstanceId || ratingScore === 0) return
    await rateActivityInstance({
      instanceId: ratingInstanceId,
      score: ratingScore,
      comment: ratingComment || null,
    })
    setRatingInstanceId(null)
    setRatingScore(0)
    setRatingComment('')
    refetchInstances({ requestPolicy: 'network-only' })
  }

  // --------------- Render: Catalog ---------------

  function renderCatalog() {
    return (
      <>
        <div style={styles.searchRow}>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.filters}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              style={selectedCategory === cat ? styles.filterBtnActive : styles.filterBtn}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {activitiesResult.fetching && <p style={styles.loadingState}>Loading activities...</p>}
        {activitiesResult.error && (
          <p style={styles.errorState}>
            Error loading activities: {activitiesResult.error.message}
          </p>
        )}

        {!activitiesResult.fetching && !activitiesResult.error && activities.length === 0 && (
          <p style={styles.emptyState}>No activities found. Try a different filter or search.</p>
        )}

        <div style={styles.grid}>
          {activities.map(
            (activity: {
              id: string
              title: string
              description: string
              category: string
              imageUrl: string | null
              difficulty: string
              estimatedDuration: string
            }) => (
              <div key={activity.id} style={styles.card}>
                <button
                  style={styles.bookmarkBtn}
                  onClick={() => handleBookmarkToggle(activity.id)}
                  title={bookmarkedIds.has(activity.id) ? 'Remove bookmark' : 'Bookmark'}
                >
                  {bookmarkedIds.has(activity.id) ? '❤️' : '🤍'}
                </button>

                {activity.imageUrl ? (
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    style={{ ...styles.cardImage, objectFit: 'cover' as const }}
                  />
                ) : (
                  <div style={styles.cardImage}>📋</div>
                )}

                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{activity.title}</h3>
                  <p style={styles.cardMeta}>
                    {activity.category}
                    {activity.estimatedDuration && ` · ${activity.estimatedDuration}`}
                  </p>
                  {activity.difficulty && (
                    <span style={styles.difficultyTag}>{activity.difficulty}</span>
                  )}
                  <p style={styles.cardDesc}>{activity.description}</p>
                  <div style={styles.cardActions}>
                    <button style={styles.startBtn} onClick={() => openStartModal(activity.id)}>
                      Start
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </>
    )
  }

  // --------------- Render: My Activities ---------------

  function renderMyActivities() {
    if (instancesResult.fetching) {
      return <p style={styles.loadingState}>Loading your activities...</p>
    }
    if (instancesResult.error) {
      return (
        <p style={styles.errorState}>Error loading activities: {instancesResult.error.message}</p>
      )
    }
    if (instances.length === 0) {
      return <p style={styles.emptyState}>You haven't started any activities yet.</p>
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {instances.map(
          (instance: {
            id: string
            status: string
            startedAt: string
            completedAt: string | null
            activity: { id: string; title: string; category: string }
          }) => (
            <div key={instance.id} style={styles.instanceCard}>
              <div style={styles.instanceInfo}>
                <h3 style={styles.instanceTitle}>{instance.activity.title}</h3>
                <p style={styles.instanceMeta}>
                  {instance.activity.category} · Started{' '}
                  {new Date(instance.startedAt).toLocaleDateString()}
                  {instance.completedAt &&
                    ` · Completed ${new Date(instance.completedAt).toLocaleDateString()}`}
                </p>
                <span style={getStatusBadgeStyle(instance.status)}>
                  {instance.status.replace('_', ' ')}
                </span>
              </div>
              <div style={styles.instanceActions}>
                {instance.status === 'PLANNED' && (
                  <button
                    style={styles.actionBtn}
                    onClick={() => handleUpdateStatus(instance.id, 'IN_PROGRESS')}
                  >
                    Mark In Progress
                  </button>
                )}
                {(instance.status === 'PLANNED' || instance.status === 'IN_PROGRESS') && (
                  <>
                    <button
                      style={styles.actionBtn}
                      onClick={() => handleUpdateStatus(instance.id, 'DONE')}
                    >
                      Complete
                    </button>
                    <button
                      style={styles.actionBtn}
                      onClick={() => handleUpdateStatus(instance.id, 'ABANDONED')}
                    >
                      Abandon
                    </button>
                  </>
                )}
                {instance.status === 'DONE' && (
                  <button
                    style={styles.actionBtn}
                    onClick={() => {
                      setRatingInstanceId(instance.id)
                      setRatingScore(0)
                      setRatingComment('')
                    }}
                  >
                    Rate
                  </button>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    )
  }

  // --------------- Render: Start Activity Modal ---------------

  function renderStartModal() {
    if (!startModalActivityId) return null

    return (
      <div style={styles.overlay} onClick={() => setStartModalActivityId(null)}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 style={styles.modalTitle}>Start Activity</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Track with:</label>
            <select
              style={styles.select}
              value={startContext.type}
              onChange={(e) =>
                setStartContext({ type: e.target.value as 'nest' | 'partner', id: '' })
              }
            >
              <option value="nest">Nest</option>
              <option value="partner">Partner Group</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              {startContext.type === 'nest' ? 'Select Nest:' : 'Select Partner Group:'}
            </label>
            <select
              style={styles.select}
              value={startContext.id}
              onChange={(e) => setStartContext({ ...startContext, id: e.target.value })}
            >
              <option value="">-- Choose --</option>
              {startContext.type === 'nest'
                ? nests.map((n: { id: string; nest: { id: string; name: string } }) => (
                    <option key={n.id} value={n.nest.id}>
                      {n.nest.name}
                    </option>
                  ))
                : partnerGroups.map((pg: { id: string; name: string }) => (
                    <option key={pg.id} value={pg.id}>
                      {pg.name}
                    </option>
                  ))}
            </select>
          </div>

          <div style={styles.modalActions}>
            <button style={styles.cancelBtn} onClick={() => setStartModalActivityId(null)}>
              Cancel
            </button>
            <button
              style={{
                ...styles.submitBtn,
                opacity: startContext.id ? 1 : 0.5,
                cursor: startContext.id ? 'pointer' : 'not-allowed',
              }}
              onClick={handleStartActivity}
              disabled={!startContext.id}
            >
              Start Activity
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --------------- Render: Rating Modal ---------------

  function renderRatingModal() {
    if (!ratingInstanceId) return null

    return (
      <div style={styles.overlay} onClick={() => setRatingInstanceId(null)}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 style={styles.modalTitle}>Rate This Activity</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Score:</label>
            <div style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  style={styles.starBtn}
                  onClick={() => setRatingScore(star)}
                  title={`${star} star${star > 1 ? 's' : ''}`}
                >
                  {star <= ratingScore ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Comment (optional):</label>
            <textarea
              style={styles.textarea}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="How was your experience?"
            />
          </div>

          <div style={styles.modalActions}>
            <button style={styles.cancelBtn} onClick={() => setRatingInstanceId(null)}>
              Cancel
            </button>
            <button
              style={{
                ...styles.submitBtn,
                opacity: ratingScore > 0 ? 1 : 0.5,
                cursor: ratingScore > 0 ? 'pointer' : 'not-allowed',
              }}
              onClick={handleSubmitRating}
              disabled={ratingScore === 0}
            >
              Submit Rating
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --------------- Main Render ---------------

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Activities</h1>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'catalog' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('catalog')}
        >
          Catalog
        </button>
        <button
          style={activeTab === 'my' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('my')}
        >
          My Activities
        </button>
      </div>

      {activeTab === 'catalog' ? renderCatalog() : renderMyActivities()}

      {renderStartModal()}
      {renderRatingModal()}
    </div>
  )
}
