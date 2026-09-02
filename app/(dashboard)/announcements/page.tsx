'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { announcementService } from '@/lib/services/announcementService';
import { Announcement, AnnouncementComment, NotificationPriority } from '@/lib/types/database.types';
import {
  Sparkles,
  Bell,
  MessageSquare,
  Heart,
  Flame,
  Plus,
  Trash2,
  Send,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { activeChoir, isAdmin } = useChoir();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // New Announcement Form State
  const [showPostModal, setShowPostModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Expanded Comments State (by announcement ID)
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, AnnouncementComment[]>>({});
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [submittingCommentMap, setSubmittingCommentMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      if (!activeChoir) return;
      setLoading(true);
      const data = await announcementService.getAnnouncements(activeChoir.id);
      setAnnouncements(data);
      setLoading(false);
    }
    loadData();
  }, [activeChoir]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoir || !title.trim() || !content.trim()) return;

    setPosting(true);
    setPostMsg(null);

    const created = await announcementService.createAnnouncement({
      choir_id: activeChoir.id,
      title: title.trim(),
      content: content.trim(),
      priority,
    });

    setPosting(false);
    if (created) {
      setPostMsg({ type: 'success', text: 'Announcement posted & singers notified!' });
      setTitle('');
      setContent('');
      setShowPostModal(false);
      const data = await announcementService.getAnnouncements(activeChoir.id);
      setAnnouncements(data);
    } else {
      setPostMsg({ type: 'error', text: 'Failed to post announcement.' });
    }
  };

  const handleDeleteAnnouncement = async (annId: string, annTitle: string) => {
    if (!confirm(`Are you sure you want to delete announcement "${annTitle}"?`)) return;
    const ok = await announcementService.deleteAnnouncement(annId);
    if (ok && activeChoir) {
      const data = await announcementService.getAnnouncements(activeChoir.id);
      setAnnouncements(data);
    }
  };

  const handleToggleReaction = async (annId: string, emoji: 'love' | 'amen' | 'clap' | 'fire') => {
    await announcementService.toggleReaction(annId, emoji);
    if (activeChoir) {
      const data = await announcementService.getAnnouncements(activeChoir.id);
      setAnnouncements(data);
    }
  };

  const toggleCommentsSection = async (annId: string) => {
    const isCurrentlyOpen = !!openComments[annId];
    setOpenComments(prev => ({ ...prev, [annId]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && !commentsMap[annId]) {
      const comments = await announcementService.getAnnouncementComments(annId);
      setCommentsMap(prev => ({ ...prev, [annId]: comments }));
    }
  };

  const handleAddComment = async (e: React.FormEvent, annId: string) => {
    e.preventDefault();
    const commentText = commentInputMap[annId] || '';
    if (!commentText.trim()) return;

    setSubmittingCommentMap(prev => ({ ...prev, [annId]: true }));
    const created = await announcementService.addComment(annId, commentText);

    setSubmittingCommentMap(prev => ({ ...prev, [annId]: false }));
    if (created) {
      setCommentInputMap(prev => ({ ...prev, [annId]: '' }));
      const updatedComments = await announcementService.getAnnouncementComments(annId);
      setCommentsMap(prev => ({ ...prev, [annId]: updatedComments }));

      // Refresh announcements list for comment count update
      if (activeChoir) {
        const data = await announcementService.getAnnouncements(activeChoir.id);
        setAnnouncements(data);
      }
    }
  };

  const handleDeleteComment = async (annId: string, commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    const ok = await announcementService.deleteComment(commentId);
    if (ok) {
      const updatedComments = await announcementService.getAnnouncementComments(annId);
      setCommentsMap(prev => ({ ...prev, [annId]: updatedComments }));
      if (activeChoir) {
        const data = await announcementService.getAnnouncements(activeChoir.id);
        setAnnouncements(data);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white py-4">
      {/* Universal Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" /> Choir Announcements Board
          </h1>
          <p className="text-sm text-slate-400">Important notices, updates &amp; discussions for {activeChoir?.name}</p>
        </div>

        {(isAdmin || user?.is_super_admin) && (
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Post New Announcement
          </button>
        )}
      </div>

      {/* New Announcement Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Post Choir Announcement
              </h3>
              <button
                onClick={() => { setShowPostModal(false); setPostMsg(null); }}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {postMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${postMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
                {postMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{postMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Service Special Rehearsal Time"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as NotificationPriority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="normal">Normal Announcement</option>
                  <option value="high">High Priority (Urgent Alert)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Content / Details *</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Type announcement details here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPostModal(false); setPostMsg(null); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-md flex items-center gap-1.5"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {posting ? 'Broadcasting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements Feed */}
      {loading ? (
        <p className="text-center text-xs text-slate-400 py-16">Loading choir announcements...</p>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-900/40 p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <Bell className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Announcements Posted</h3>
          <p className="text-xs text-slate-400">Check back later for choir news and rehearsal updates.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map(ann => {
            const comments = commentsMap[ann.id] || [];
            const isCommentsOpen = !!openComments[ann.id];
            const isSubmittingComment = !!submittingCommentMap[ann.id];

            return (
              <div key={ann.id} className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 hover:border-amber-500/40 transition-all shadow-xl">
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-800/60 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        ann.priority === 'high' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                      }`}>
                        {ann.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400">
                        Posted by <strong className="text-purple-300">{ann.author_profile?.full_name || 'Choir Director'}</strong>
                      </span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white">{ann.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>

                    {(isAdmin || user?.is_super_admin || ann.created_by === user?.id) && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Announcement Content */}
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{ann.content}</p>

                {/* Reactions & Comment Expand Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
                  {/* Emoji Reactions Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleReaction(ann.id, 'love')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        ann.user_reactions?.includes('love')
                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-400" /> ❤️
                    </button>

                    <button
                      onClick={() => handleToggleReaction(ann.id, 'amen')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        ann.user_reactions?.includes('amen')
                          ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      🙏 Amen
                    </button>

                    <button
                      onClick={() => handleToggleReaction(ann.id, 'clap')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        ann.user_reactions?.includes('clap')
                          ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      👏 Clap
                    </button>

                    <button
                      onClick={() => handleToggleReaction(ann.id, 'fire')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        ann.user_reactions?.includes('fire')
                          ? 'bg-orange-950/80 border-orange-500/50 text-orange-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-400" /> 🔥
                    </button>

                    {ann.reactions_count ? (
                      <span className="text-xs text-slate-400 font-semibold pl-1">
                        {ann.reactions_count} reaction(s)
                      </span>
                    ) : null}
                  </div>

                  {/* Toggle Comments */}
                  <button
                    onClick={() => toggleCommentsSection(ann.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{ann.comments_count || 0} Comment(s)</span>
                  </button>
                </div>

                {/* Expanded Comments & Discussion Section */}
                {isCommentsOpen && (
                  <div className="space-y-4 pt-4 border-t border-slate-800/60 bg-slate-950/40 p-4 rounded-2xl">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Discussion &amp; Replies</h4>

                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No comments yet. Be the first singer to comment!</p>
                    ) : (
                      <div className="space-y-3">
                        {comments.map(c => (
                          <div key={c.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-purple-300">{c.user_profile?.full_name || 'Choir Member'}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200">{c.content}</p>
                            </div>

                            {(c.user_id === user?.id || isAdmin || user?.is_super_admin) && (
                              <button
                                onClick={() => handleDeleteComment(ann.id, c.id)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input Form */}
                    <form onSubmit={e => handleAddComment(e, ann.id)} className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        required
                        value={commentInputMap[ann.id] || ''}
                        onChange={e => setCommentInputMap(prev => ({ ...prev, [ann.id]: e.target.value }))}
                        placeholder="Write a comment or reply..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1 shrink-0"
                      >
                        {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Comment</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
