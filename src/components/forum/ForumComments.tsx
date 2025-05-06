'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Comment = {
    id: number
    content: string
    createdAt: string
    updatedAt: string
    isEdited: boolean
    user: {
        id: number
        username: string
    }
    replies?: Comment[]
}

type ForumCommentsProps = {
    forumPostId: number
}

export default function ForumComments({ forumPostId }: ForumCommentsProps) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [replyToId, setReplyToId] = useState<number | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
    const [editContent, setEditContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchComments()
    }, [forumPostId])

    const fetchComments = async () => {
        try {
            setError(null);
            const url = `/api/forum/comments?forumPostId=${forumPostId}`;
            console.log("Fetching comments from:", url);

            const response = await fetch(url);
            console.log("Response status:", response.status);

            // Get the raw response text first for debugging
            const rawText = await response.text();
            console.log("Raw response text:", rawText);

            // Handle empty responses
            if (!rawText.trim()) {
                console.log("Empty response received");
                setComments([]);
                setStatusMessage("No comments data received from server");
                return;
            }

            // Try to parse JSON after confirming we have content
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseError) {
                console.error("Failed to parse response as JSON:", parseError);
                setError("Server returned invalid data format");
                return;
            }

            // Process the data
            if (data.message) {
                setStatusMessage(data.message);
            }

            if (Array.isArray(data.comments)) {
                setComments(data.comments);
            } else if (Array.isArray(data)) {
                setComments(data);
            } else {
                setComments([]);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            setError('Failed to load comments. Please try again later.');
        }
    }

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!session) {
            setError('You must be logged in to comment')
            return
        }

        if (!newComment.trim()) {
            setError('Comment cannot be empty')
            return
        }

        try {
            setIsSubmitting(true)
            setError(null)

            const response = await fetch('/api/forum/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    forumPostId,
                    content: newComment
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            // On success, reset the form and fetch the updated comments
            setNewComment('')
            fetchComments()
        } catch (error) {
            console.error('Error posting comment:', error)
            setError(error instanceof Error ? error.message : 'Failed to post comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!session) {
            setError('You must be logged in to reply')
            return
        }

        if (!replyContent.trim() || !replyToId) {
            setError('Reply content cannot be empty')
            return
        }

        try {
            setIsSubmitting(true)
            setError(null)

            const response = await fetch('/api/forum/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    forumPostId,
                    content: replyContent,
                    parentId: replyToId
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            // On success, reset the form and fetch the updated comments
            setReplyContent('')
            setReplyToId(null)
            fetchComments()
        } catch (error) {
            console.error('Error posting reply:', error)
            setError(error instanceof Error ? error.message : 'Failed to post reply')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!session) {
            setError('You must be logged in to edit a comment')
            return
        }

        if (!editContent.trim() || !editingCommentId) {
            setError('Comment content cannot be empty')
            return
        }

        try {
            setIsSubmitting(true)
            setError(null)

            const response = await fetch(`/api/forum/comments/${editingCommentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: editContent
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            // On success, reset the form and fetch the updated comments
            setEditContent('')
            setEditingCommentId(null)
            fetchComments()
        } catch (error) {
            console.error('Error editing comment:', error)
            setError(error instanceof Error ? error.message : 'Failed to edit comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteComment = async (commentId: number) => {
        if (!session) {
            setError('You must be logged in to delete a comment')
            return
        }

        if (!confirm('Are you sure you want to delete this comment?')) {
            return
        }

        try {
            setError(null)

            const response = await fetch(`/api/forum/comments/${commentId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
            }

            // On success, fetch the updated comments
            fetchComments()
        } catch (error) {
            console.error('Error deleting comment:', error)
            setError(error instanceof Error ? error.message : 'Failed to delete comment')
        }
    }

    const startEditing = (comment: Comment) => {
        setEditingCommentId(comment.id)
        setEditContent(comment.content)
        setReplyToId(null)
        setReplyContent('')
    }

    const startReplying = (commentId: number) => {
        setReplyToId(commentId)
        setReplyContent('')
        setEditingCommentId(null)
        setEditContent('')
    }

    const cancelAction = () => {
        setReplyToId(null)
        setReplyContent('')
        setEditingCommentId(null)
        setEditContent('')
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const canModifyComment = (userId: number) => {
        if (!session?.user) return false
        return parseInt(session.user.id) === userId
    }

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Comments</h2>

            {error && (
                <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            {statusMessage && (
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-3 rounded-md mb-4">
                    {statusMessage}
                </div>
            )}

            {session ? (
                <form onSubmit={handleSubmitComment} className="mb-8">
                    <div className="mb-4">
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Add a comment
                        </label>
                        <textarea
                            id="comment"
                            rows={3}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                            placeholder="Write your comment here..."
                            style={{ color: '#000000', backgroundColor: '#ffffff' }} // Inline style forcing black text on white background
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className={`px-4 py-2 rounded-md ${isSubmitting || !newComment.trim()
                                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                    >
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </form>
            ) : (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Please{' '}
                        <Link href="/auth/signin" className="text-primary-600 hover:text-primary-500">
                            sign in
                        </Link>{' '}
                        to leave a comment.
                    </p>
                </div>
            )}

            <div className="space-y-6">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                            <div className="flex items-start">
                                <div className="flex-1">
                                    {editingCommentId === comment.id ? (
                                        <form onSubmit={handleSubmitEdit} className="mb-4">
                                            <textarea
                                                rows={3}
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                disabled={isSubmitting}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2"
                                            />
                                            <div className="flex space-x-2">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !editContent.trim()}
                                                    className={`px-3 py-1 rounded-md ${isSubmitting || !editContent.trim()
                                                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                                        }`}
                                                >
                                                    {isSubmitting ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelAction}
                                                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-center mb-1">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{comment.user.username}</span>
                                                <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt)}</span>
                                                {comment.isEdited && (
                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(edited)</span>
                                                )}
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{comment.content}</p>

                                            <div className="mt-2 flex space-x-4">
                                                {session && (
                                                    <button
                                                        onClick={() => startReplying(comment.id)}
                                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                                                    >
                                                        Reply
                                                    </button>
                                                )}

                                                {canModifyComment(comment.user.id) && (
                                                    <>
                                                        <button
                                                            onClick={() => startEditing(comment)}
                                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {replyToId === comment.id && (
                                <div className="mt-4 ml-8">
                                    <form onSubmit={handleSubmitReply}>
                                        <textarea
                                            rows={2}
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            disabled={isSubmitting}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2"
                                            placeholder="Write your reply here..."
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !replyContent.trim()}
                                                className={`px-3 py-1 rounded-md ${isSubmitting || !replyContent.trim()
                                                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                                    }`}
                                            >
                                                {isSubmitting ? 'Posting...' : 'Post Reply'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelAction}
                                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Replies Section */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-8 mt-4 space-y-4">
                                    {comment.replies.map((reply) => (
                                        <div key={reply.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                                            {editingCommentId === reply.id ? (
                                                <form onSubmit={handleSubmitEdit} className="mb-4">
                                                    <textarea
                                                        rows={2}
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        disabled={isSubmitting}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-2"
                                                    />
                                                    <div className="flex space-x-2">
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting || !editContent.trim()}
                                                            className={`px-3 py-1 rounded-md ${isSubmitting || !editContent.trim()
                                                                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                                                                }`}
                                                        >
                                                            {isSubmitting ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelAction}
                                                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="flex items-center mb-1">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{reply.user.username}</span>
                                                        <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(reply.createdAt)}</span>
                                                        {reply.isEdited && (
                                                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(edited)</span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{reply.content}</p>

                                                    {canModifyComment(reply.user.id) && (
                                                        <div className="mt-2 flex space-x-4">
                                                            <button
                                                                onClick={() => startEditing(reply)}
                                                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteComment(reply.id)}
                                                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>
        </div>
    )
}