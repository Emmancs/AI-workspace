'use client';

import * as React from 'react';
import { MessageCircle, X, Check, AtSign } from 'lucide-react';
import { Button } from './button';

export interface CommentData {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
  isResolved?: boolean;
  replies?: ReplyData[];
  mentions?: string[]; // Array of mentioned user IDs
}

export interface ReplyData {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: Date;
  mentions?: string[]; // Array of mentioned user IDs
}

export interface MentionableMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface CommentsThreadProps {
  comments: CommentData[];
  members?: MentionableMember[];
  onAddComment?: (content: string, mentions?: string[]) => void;
  onAddReply?: (commentId: string, content: string, mentions?: string[]) => void;
  onResolve?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function CommentsThread({
  comments,
  members = [],
  onAddComment,
  onAddReply,
  onResolve,
  onDeleteComment,
}: CommentsThreadProps) {
  const [expandedComment, setExpandedComment] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState<{ [key: string]: string }>({});
  const [newComment, setNewComment] = React.useState('');
  const [mentionSuggestions, setMentionSuggestions] = React.useState<MentionableMember[]>([]);
  const [showMentionsSuggestion, setShowMentionsSuggestion] = React.useState(false);
  const [mentionField, setMentionField] = React.useState<'comment' | string | null>(null);
  const [mentionQuery, setMentionQuery] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Extract mentions from text (format: @username)
  const extractMentions = (text: string): { text: string; mentions: string[] } => {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionPattern.exec(text)) !== null) {
      const memberName = match[1];
      const member = members.find((m) => m.name.toLowerCase() === memberName.toLowerCase());
      if (member) {
        mentions.push(member.id);
      }
    }
    return { text, mentions };
  };

  // Handle @ mention detection
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1);
      const beforeAt = value.substring(0, lastAtIndex + 1);

      // Check if @ is followed by word characters and no space
      if (/^\w*$/.test(afterAt) && (lastAtIndex === 0 || /\s/.test(value[lastAtIndex - 1]))) {
        setMentionField('comment');
        setMentionQuery(afterAt);
        setShowMentionsSuggestion(true);

        // Filter members by query
        if (afterAt.length > 0) {
          const filtered = members.filter((m) =>
            m.name.toLowerCase().startsWith(afterAt.toLowerCase())
          );
          setMentionSuggestions(filtered);
        } else {
          setMentionSuggestions(members);
        }
      } else {
        setShowMentionsSuggestion(false);
      }
    } else {
      setShowMentionsSuggestion(false);
    }
  };

  const insertMention = (member: MentionableMember, field: 'comment' | string) => {
    if (field === 'comment') {
      const lastAtIndex = newComment.lastIndexOf('@');
      const before = newComment.substring(0, lastAtIndex);
      const after = newComment.substring(lastAtIndex + mentionQuery.length + 1);
      const newText = `${before}@${member.name} ${after}`;
      setNewComment(newText);
    } else {
      const lastAtIndex = replyText[field]?.lastIndexOf('@') || -1;
      if (lastAtIndex !== -1) {
        const before = replyText[field].substring(0, lastAtIndex);
        const after = replyText[field].substring(lastAtIndex + mentionQuery.length + 1);
        const newText = `${before}@${member.name} ${after}`;
        setReplyText({ ...replyText, [field]: newText });
      }
    }
    setShowMentionsSuggestion(false);
    setMentionQuery('');
  };

  return (
    <div className="space-y-4">
      {/* New Comment Form */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">Add a comment</label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleCommentChange}
            placeholder="Add a comment... (type @ to mention someone)"
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            rows={3}
          />
          
          {/* Mentions Autocomplete */}
          {showMentionsSuggestion && mentionField === 'comment' && mentionSuggestions.length > 0 && (
            <div className="absolute bottom-full left-3 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 w-48">
              {mentionSuggestions.map((member) => (
                <button
                  key={member.id}
                  onClick={() => insertMention(member, 'comment')}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-slate-700 flex items-center gap-2 transition-colors"
                >
                  {member.avatarUrl && (
                    <img src={member.avatarUrl} alt={member.name} className="w-5 h-5 rounded-full" />
                  )}
                  <span>{member.name}</span>
                  <span className="text-slate-400 text-[11px]">{member.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
              const { text, mentions } = extractMentions(newComment);
              onAddComment?.(text, mentions);
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
                    <div className="relative">
                      <textarea
                        value={replyText[comment.id] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setReplyText({ ...replyText, [comment.id]: value });

                          // Handle mention detection for replies
                          const lastAtIndex = value.lastIndexOf('@');
                          if (lastAtIndex !== -1) {
                            const afterAt = value.substring(lastAtIndex + 1);
                            if (/^\w*$/.test(afterAt) && (lastAtIndex === 0 || /\s/.test(value[lastAtIndex - 1]))) {
                              setMentionField(comment.id);
                              setMentionQuery(afterAt);
                              setShowMentionsSuggestion(true);

                              if (afterAt.length > 0) {
                                const filtered = members.filter((m) =>
                                  m.name.toLowerCase().startsWith(afterAt.toLowerCase())
                                );
                                setMentionSuggestions(filtered);
                              } else {
                                setMentionSuggestions(members);
                              }
                            } else {
                              setShowMentionsSuggestion(false);
                            }
                          } else {
                            setShowMentionsSuggestion(false);
                          }
                        }}
                        placeholder="Write a reply... (type @ to mention someone)"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                        rows={2}
                      />
                      
                      {/* Mentions Autocomplete for Replies */}
                      {showMentionsSuggestion && mentionField === comment.id && mentionSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-2 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 w-48">
                          {mentionSuggestions.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => insertMention(member, comment.id)}
                              className="w-full text-left px-3 py-2 text-xs text-white hover:bg-slate-700 flex items-center gap-2 transition-colors"
                            >
                              {member.avatarUrl && (
                                <img src={member.avatarUrl} alt={member.name} className="w-5 h-5 rounded-full" />
                              )}
                              <span>{member.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                          const { text: cleanText, mentions } = extractMentions(text);
                          onAddReply?.(comment.id, cleanText, mentions);
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
