'use client';

import * as React from 'react';
import { MessageCircle, X, Check } from 'lucide-react';
import { Button } from './button';

export interface CommentData {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
  isResolved?: boolean;
  replies?: ReplyData[];
}

export interface ReplyData {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
}

interface CommentsThreadProps {
  comments: CommentData[];
  onAddComment?: (content: string) => void;
  onAddReply?: (commentId: string, content: string) => void;
  onResolve?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function CommentsThread({
  comments,
  onAddComment,
  onAddReply,
  onResolve,
  onDeleteComment,
}: CommentsThreadProps) {
  const [expandedComment, setExpandedComment] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState<{ [key: string]: string }>({});
  const [newComment, setNewComment] = React.useState('');

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">Add a comment</label>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewComment('')}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => {
              onAddComment?.(newComment);
              setNewComment('');
            }}
            disabled={!newComment.trim()}
          >
            <span>Comment</span>
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mt-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`p-3 rounded-lg border transition-colors ${
              comment.isResolved
                ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
                : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            {/* Comment Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                {comment.authorAvatar && (
                  <img
                    src={comment.authorAvatar}
                    alt={comment.author}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{comment.author}</span>
                    <span className="text-[11px] text-slate-500">
                      {comment.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{comment.content}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!comment.isResolved && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResolve?.(comment.id)}
                      title="Mark as resolved"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {comment.isResolved && (
                  <span className="text-[11px] text-emerald-400">Resolved</span>
                )}
              </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 ml-8 space-y-2 border-l border-slate-800 pl-3">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex items-start gap-2">
                    {reply.authorAvatar && (
                      <img
                        src={reply.authorAvatar}
                        alt={reply.author}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300">{reply.author}</span>
                        <span className="text-[11px] text-slate-500">
                          {reply.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {!comment.isResolved && (
              <div className="mt-3">
                {expandedComment !== comment.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedComment(comment.id)}
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Reply</span>
                  </Button>
                ) : (
                  <div className="space-y-2 ml-8">
                    <textarea
                      value={replyText[comment.id] || ''}
                      onChange={(e) =>
                        setReplyText({ ...replyText, [comment.id]: e.target.value })
                      }
                      placeholder="Write a reply..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExpandedComment(null);
                          setReplyText({ ...replyText, [comment.id]: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => {
                          const text = replyText[comment.id];
                          onAddReply?.(comment.id, text);
                          setReplyText({ ...replyText, [comment.id]: '' });
                          setExpandedComment(null);
                        }}
                        disabled={!replyText[comment.id]?.trim()}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}
