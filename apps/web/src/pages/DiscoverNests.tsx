import { useState } from 'react'
import { useQuery, useMutation, gql } from 'urql'
import { Link } from 'react-router'

const SEARCH_NESTS_QUERY = gql`
  query SearchNests($name: String, $city: String, $state: String, $zipcode: String) {
    searchNests(name: $name, city: $city, state: $state, zipcode: $zipcode) {
      id
      name
      description
      city
      state
      zipcode
      memberCount
      maxMembers
    }
  }
`

const MY_JOIN_REQUESTS_QUERY = gql`
  query MyJoinRequests {
    myJoinRequests {
      id
      nestId
      status
      createdAt
    }
  }
`

const REQUEST_TO_JOIN_MUTATION = gql`
  mutation RequestToJoinNest($nestId: String!, $message: String) {
    requestToJoinNest(nestId: $nestId, message: $message) {
      id
      status
    }
  }
`

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '1.8rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#666',
    marginBottom: '2rem',
  },
  searchForm: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    marginBottom: '2rem',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#555',
  },
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
    minWidth: '150px',
  },
  button: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  primaryButton: {
    background: '#2d6a4f',
    color: '#fff',
  },
  secondaryButton: {
    background: '#e0e0e0',
    color: '#333',
  },
  disabledButton: {
    background: '#ccc',
    color: '#999',
    cursor: 'not-allowed' as const,
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  card: {
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: 0,
  },
  cardDescription: {
    fontSize: '0.9rem',
    color: '#555',
    margin: '0 0 0.5rem',
  },
  cardMeta: {
    fontSize: '0.85rem',
    color: '#666',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#999',
  },
  pendingBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: '#fff3e0',
    color: '#e65100',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: '1rem',
    color: '#2d6a4f',
    fontWeight: 500,
    textDecoration: 'none',
  },
  messageInput: {
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.85rem',
    width: '200px',
    marginRight: '0.5rem',
  },
}

export function DiscoverNests() {
  const [searchName, setSearchName] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [searchState, setSearchState] = useState('')
  const [searchZipcode, setSearchZipcode] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [joinMessage, setJoinMessage] = useState<Record<string, string>>({})

  const [searchResult, reexecuteSearch] = useQuery({
    query: SEARCH_NESTS_QUERY,
    variables: {
      name: searchName || undefined,
      city: searchCity || undefined,
      state: searchState || undefined,
      zipcode: searchZipcode || undefined,
    },
    pause: !hasSearched,
  })

  const [joinRequestsResult, reexecuteJoinRequests] = useQuery({
    query: MY_JOIN_REQUESTS_QUERY,
  })

  const [, requestToJoin] = useMutation(REQUEST_TO_JOIN_MUTATION)

  const handleSearch = () => {
    setHasSearched(true)
    reexecuteSearch({ requestPolicy: 'network-only' })
  }

  const handleRequestToJoin = async (nestId: string) => {
    const message = joinMessage[nestId]?.trim() || undefined
    await requestToJoin({ nestId, message })
    setJoinMessage((prev) => ({ ...prev, [nestId]: '' }))
    reexecuteJoinRequests({ requestPolicy: 'network-only' })
    reexecuteSearch({ requestPolicy: 'network-only' })
  }

  const nests = searchResult.data?.searchNests ?? []
  const myRequests = joinRequestsResult.data?.myJoinRequests ?? []
  const pendingNestIds = new Set(
    myRequests.filter((r: any) => r.status === 'PENDING').map((r: any) => r.nestId),
  )

  return (
    <div style={styles.container}>
      <Link to="/nests" style={styles.backLink}>
        &larr; Back to My Nests
      </Link>

      <h1 style={styles.heading}>Discover Nests</h1>
      <p style={styles.subtitle}>Search for public nests by name or location</p>

      {/* Search Form */}
      <div style={styles.searchForm}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by name"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>City</label>
          <input
            style={styles.input}
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="City"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>State</label>
          <input
            style={{ ...styles.input, minWidth: '100px' }}
            type="text"
            value={searchState}
            onChange={(e) => setSearchState(e.target.value)}
            placeholder="State"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Zip Code</label>
          <input
            style={{ ...styles.input, minWidth: '100px' }}
            type="text"
            value={searchZipcode}
            onChange={(e) => setSearchZipcode(e.target.value)}
            placeholder="Zip"
          />
        </div>
        <div style={{ ...styles.formGroup, justifyContent: 'flex-end' }}>
          <button style={{ ...styles.button, ...styles.primaryButton }} onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {searchResult.fetching && <p style={styles.empty}>Searching...</p>}

      {hasSearched && !searchResult.fetching && nests.length === 0 && (
        <p style={styles.empty}>No public nests found matching your search.</p>
      )}

      {nests.length > 0 && (
        <div style={styles.list}>
          {nests.map((nest: any) => {
            const location = [nest.city, nest.state, nest.zipcode].filter(Boolean).join(', ')
            const hasPendingRequest = pendingNestIds.has(nest.id)

            return (
              <div key={nest.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>
                    <Link
                      to={`/nests/${nest.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {nest.name}
                    </Link>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {hasPendingRequest ? (
                      <span style={styles.pendingBadge}>Request Pending</span>
                    ) : (
                      <>
                        <input
                          style={styles.messageInput}
                          type="text"
                          placeholder="Optional message"
                          value={joinMessage[nest.id] ?? ''}
                          onChange={(e) =>
                            setJoinMessage((prev) => ({ ...prev, [nest.id]: e.target.value }))
                          }
                        />
                        <button
                          style={{ ...styles.button, ...styles.primaryButton }}
                          onClick={() => handleRequestToJoin(nest.id)}
                        >
                          Request to Join
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {nest.description && <p style={styles.cardDescription}>{nest.description}</p>}
                <div style={styles.cardMeta}>
                  {location && <span>{location} &bull; </span>}
                  <span>
                    {nest.memberCount}
                    {nest.maxMembers ? ` / ${nest.maxMembers}` : ''} members
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
