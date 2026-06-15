import { useState } from 'react'
import { useQuery, useMutation, gql } from 'urql'
// TODO: import { useAuth } from '../lib/auth-context' — gate delete to comment author

interface DiscussionProps {
  activityInstanceId: string
}

const DISCUSSION_QUERY = gql`
  query Discussion($activityInstanceId: String!) {
    discussion(activityInstanceId: $activityInstanceId) {
      id
      comments {
        id
        body
        createdAt
        author {
          id
          displayName
          avatarUrl
        }
        parentCommentId
        reactions {
          id
          emoji
          user {
            id
            displayName
          }
        }
      }
    }
  }
`

const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) {
      id
      body
    }
  }
`

const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($commentId: String!) {
    deleteComment(commentId: $commentId)
  }
`

const ADD_REACTION_MUTATION = gql`
  mutation AddReaction($commentId: String!, $emoji: String!) {
    addReaction(commentId: $commentId, emoji: $emoji) {
      id
    }
  }
`

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥']

interface Comment {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    displayName: string
    avatarUrl: string | null
  }
  parentCommentId: string | null
  reactions: {
    id: string
    emoji: string
    user: {
      id: string
      displayName: string
    }
  }[]
}

export function Discussion({ activityInstanceId }: DiscussionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [newCommentBody, setNewCommentBody] = useState('')

  const [{ data, fetching, error }, refetchDiscussion] = useQuery({
    query: DISCUSSION_QUERY,
    variables: { activityInstanceId },
  })

  const [, addComment] = useMutation(ADD_COMMENT_MUTATION)
  const [, deleteComment] = useMutation(DELETE_COMMENT_MUTATION)
  const [, addReaction] = useMutation(ADD_REACTION_MUTATION)

  const discussion = data?.discussion
  const comments: Comment[] = discussion?.comments ?? []

  const topLevelComments = comments.filter((c) => !c.parentCommentId)
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parentCommentId) {
      if (!acc[c.parentCommentId]) acc[c.parentCommentId] = []
      acc[c.parentCommentId].push(c)
    }
    return acc
  }, {})

  async function handleAddComment(parentCommentId?: string) {
    if (!discussion) return
    const body = parentCommentId ? replyBody : newCommentBody
    if (!body.trim()) return

    await addComment({
      input: {
        discussionId: discussion.id,
        body: body.trim(),
        parentCommentId: parentCommentId ?? undefined,
      },
    })

    if (parentCommentId) {
      setReplyBody('')
      setReplyingTo(null)
    } else {
      setNewCommentBody('')
    }

    refetchDiscussion({ requestPolicy: 'network-only' })
  }

  async function handleDelete(commentId: string) {
    await deleteComment({ commentId })
    refetchDiscussion({ requestPolicy: 'network-only' })
  }

  async function handleReaction(commentId: string, emoji: string) {
    await addReaction({ commentId, emoji })
    refetchDiscussion({ requestPolicy: 'network-only' })
  }

  function groupReactions(
    reactions: Comment['reactions'],
  ): { emoji: string; count: number; users: string[] }[] {
    const map: Record<string, { count: number; users: string[] }> = {}
    for (const r of reactions) {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, users: [] }
      map[r.emoji].count++
      map[r.emoji].users.push(r.user.displayName)
    }
    return Object.entries(map).map(([emoji, { count, users }]) => ({
      emoji,
      count,
      users,
    }))
  }

  function renderComment(comment: Comment, isReply: boolean) {
    const grouped = groupReactions(comment.reactions)
    const replies = repliesByParent[comment.id] ?? []

    return (
      <div
        key={comment.id}
        style={{
          marginLeft: isReply ? 32 : 0,
          marginBottom: 12,
          padding: 12,
          backgroundColor: isReply ? '#f9f9f9' : '#fff',
          borderRadius: 8,
          border: '1px solid #e0e0e0',
        }}
      >
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.displayName}
              style={{ width: 28, height: 28, borderRadius: '50%' }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#2d6a4f',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {comment.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontWeight: 600, fontSize: 14 }}>{comment.author.displayName}</span>
          <span style={{ fontSize: 12, color: '#666' }}>
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Body */}
        <p style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.5 }}>{comment.body}</p>

        {/* Reactions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          {grouped.map((r) => (
            <button
              key={r.emoji}
              onClick={() => handleReaction(comment.id, r.emoji)}
              title={r.users.join(', ')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                fontSize: 13,
                borderRadius: 12,
                border: '1px solid #ccc',
                backgroundColor: '#e8f5e9',
                cursor: 'pointer',
              }}
            >
              <span>{r.emoji}</span>
              <span>{r.count}</span>
            </button>
          ))}

          {/* Quick-add emoji buttons */}
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(comment.id, emoji)}
              style={{
                padding: '2px 6px',
                fontSize: 13,
                borderRadius: 12,
                border: '1px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                opacity: 0.5,
              }}
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2d6a4f',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                padding: 0,
              }}
            >
              Reply
            </button>
          )}
          {/* TODO: Match comment.author.id to current user id once auth ids are aligned */}
          <button
            onClick={() => handleDelete(comment.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c62828',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              padding: 0,
            }}
          >
            Delete
          </button>
        </div>

        {/* Inline reply form */}
        {replyingTo === comment.id && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment(comment.id)
              }}
            />
            <button
              onClick={() => handleAddComment(comment.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: '#2d6a4f',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div style={{ marginTop: 8 }}>{replies.map((reply) => renderComment(reply, true))}</div>
        )}
      </div>
    )
  }

  if (fetching) return <p>Loading discussion...</p>
  if (error) return <p style={{ color: '#c62828' }}>Error loading discussion.</p>

  return (
    <div style={{ maxWidth: 640 }}>
      <h3 style={{ color: '#2d6a4f', marginBottom: 16 }}>Discussion</h3>

      {/* Comments list */}
      <div>
        {topLevelComments.length === 0 && (
          <p style={{ color: '#666', fontSize: 14 }}>No comments yet. Start the conversation!</p>
        )}
        {topLevelComments.map((comment) => renderComment(comment, false))}
      </div>

      {/* New comment form */}
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          type="text"
          value={newCommentBody}
          onChange={(e) => setNewCommentBody(e.target.value)}
          placeholder="Add a comment..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            fontSize: 14,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddComment()
          }}
        />
        <button
          onClick={() => handleAddComment()}
          style={{
            padding: '8px 18px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#2d6a4f',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Post
        </button>
      </div>
    </div>
  )
}
