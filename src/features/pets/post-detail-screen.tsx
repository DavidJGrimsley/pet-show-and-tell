import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Container } from '../../components/Container';
import { PetArtwork } from '../../components/pet-artwork';
import { MAX_COMMENT_LENGTH, type ReactionKind, normalizeCommentBody } from '../../types/pet';
import { usePetStore } from './pet-store';

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const postId = typeof params.id === 'string' ? params.id : '';
  const isHydrated = usePetStore((state) => state.isHydrated);
  const isLoading = usePetStore((state) => state.isLoading);
  const error = usePetStore((state) => state.error);
  const pets = usePetStore((state) => state.pets);
  const posts = usePetStore((state) => state.posts);
  const reactions = usePetStore((state) => state.reactions);
  const allComments = usePetStore((state) => state.comments);
  const commentReactions = usePetStore((state) => state.commentReactions);
  const refresh = usePetStore((state) => state.refresh);
  const toggleReaction = usePetStore((state) => state.toggleReaction);
  const addComment = usePetStore((state) => state.addComment);
  const toggleCommentReaction = usePetStore((state) => state.toggleCommentReaction);
  const deletePost = usePetStore((state) => state.deletePost);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [commentComposer, setCommentComposer] = useState<{
    postId: string;
    draft: string;
    error: string | null;
  }>({ postId, draft: '', error: null });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const post = posts.find((item) => item.id === postId);
  const pet = pets.find((item) => item.id === post?.petId);
  const reaction = reactions[postId];
  const postComments = allComments.filter((item) => item.postId === postId);
  const commentDraft = commentComposer.postId === postId ? commentComposer.draft : '';
  const commentError = commentComposer.postId === postId ? commentComposer.error : null;
  const trimmedCommentLength = commentDraft.trim().length;
  const isCommentOverLimit = trimmedCommentLength > MAX_COMMENT_LENGTH;

  useEffect(() => {
    if (!isHydrated) {
      void refresh().catch(() => undefined);
    }
  }, [isHydrated, refresh]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#396e55" size="large" />
        <Text style={styles.loadingText}>Opening this pet moment…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFoundTitle}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refresh().catch(() => undefined)}
          style={styles.backButton}>
          <Text style={styles.backText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!isHydrated) {
    return null;
  }

  if (!post || !pet) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFoundTitle}>We could not find that post</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={styles.backButton}>
          <Text style={styles.backText}>Back to the feed</Text>
        </Pressable>
      </View>
    );
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(post.createdAt));

  const react = (kind: ReactionKind) => {
    void toggleReaction(post.id, kind).catch(() => undefined);
  };

  const reactToComment = (commentId: string, kind: ReactionKind) => {
    void toggleCommentReaction(commentId, kind).catch(() => undefined);
  };

  const submitComment = async () => {
    if (isSubmittingComment) {
      return;
    }
    let trimmedBody: string;
    try {
      trimmedBody = normalizeCommentBody(commentDraft);
    } catch (validationError) {
      setCommentComposer({
        postId,
        draft: commentDraft,
        error:
          validationError instanceof Error
            ? validationError.message
            : 'Write a comment before posting.',
      });
      return;
    }

    setIsSubmittingComment(true);
    setCommentComposer({ postId, draft: commentDraft, error: null });
    try {
      await addComment({ postId: post.id, body: trimmedBody });
      setCommentComposer({ postId, draft: '', error: null });
    } catch (saveError) {
      setCommentComposer({
        postId,
        draft: commentDraft,
        error:
          saveError instanceof Error
            ? saveError.message
            : 'Your comment could not be saved. Try again.',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatCommentTimestamp = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));

  const handleDelete = async () => {
    if (!pet.isUserPet || isDeleting) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deletePost(post.id);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'We could not delete this moment. Please try again.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}>
      <Container>
        <View style={styles.innerContainer}>
          <PetArtwork
            aspectRatio={0.98}
            name={pet.name}
            photoUri={post.photoUri}
            species={pet.species}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'View ' + pet.name + "'s profile"}
            onPress={() => router.push({ pathname: '/my-pet', params: { id: pet.id } })}
            style={styles.titleGroup}>
            <View style={styles.titleRow}>
              <Text style={styles.petName}>{pet.name}</Text>
              <View style={styles.profileLink}>
                <Text style={styles.profileLinkText}>View profile ›</Text>
              </View>
            </View>
            <Text style={styles.species}>
              {pet.species} · {dateLabel}
            </Text>
          </Pressable>
          <Text selectable style={styles.description}>
            {post.caption}
          </Text>
          <View>
            <Text style={styles.personalityLabel}>Personality</Text>
            <Text selectable style={styles.description}>
              {pet.personality}
            </Text>
          </View>

          <View style={styles.reactions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Like ' + pet.name + "'s post"}
              accessibilityState={{ selected: reaction === 'like' }}
              aria-selected={reaction === 'like'}
              onPress={() => react('like')}
              style={[styles.reaction, reaction === 'like' ? styles.likeSelected : null]}>
              <Text style={styles.reactionEmoji}>👍</Text>
              <Text style={[styles.reactionText, reaction === 'like' ? styles.activeText : null]}>
                Like
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Love ' + pet.name + "'s post"}
              accessibilityState={{ selected: reaction === 'love' }}
              aria-selected={reaction === 'love'}
              onPress={() => react('love')}
              style={[styles.reaction, reaction === 'love' ? styles.loveSelected : null]}>
              <Text style={styles.reactionEmoji}>💚</Text>
              <Text style={[styles.reactionText, reaction === 'love' ? styles.activeText : null]}>
                Love
              </Text>
            </Pressable>
          </View>

          <View style={styles.localNote}>
            <Text style={styles.localNoteEmoji}>🔒</Text>
            <Text style={styles.localNoteText}>
              Your reactions and comments are saved on this device. This demo does not publish
              activity to a public service.
            </Text>
          </View>

          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsHeading}>Comments</Text>
              <Text style={styles.commentsCount}>
                {postComments.length} {postComments.length === 1 ? 'comment' : 'comments'}
              </Text>
            </View>

            <View style={styles.composerCard}>
              <Text style={styles.commentInputLabel}>Add a comment</Text>
              <TextInput
                accessibilityLabel="Add a comment"
                multiline
                onChangeText={(value) => {
                  setCommentComposer({ postId, draft: value, error: null });
                }}
                placeholder={'Leave a friendly note for ' + pet.name}
                placeholderTextColor="#89948d"
                style={styles.commentInput}
                value={commentDraft}
              />
              <View style={styles.composerFooter}>
                <Text
                  accessibilityLabel={
                    trimmedCommentLength + ' of ' + MAX_COMMENT_LENGTH + ' characters'
                  }
                  style={[
                    styles.commentCounter,
                    isCommentOverLimit ? styles.commentCounterOver : null,
                  ]}>
                  {trimmedCommentLength}/{MAX_COMMENT_LENGTH}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Post comment"
                  accessibilityState={{ disabled: isSubmittingComment }}
                  disabled={isSubmittingComment}
                  onPress={() => void submitComment()}
                  style={[
                    styles.postCommentButton,
                    isSubmittingComment ? styles.disabledButton : null,
                  ]}>
                  <Text style={styles.postCommentButtonText}>
                    {isSubmittingComment ? 'Posting…' : 'Post comment'}
                  </Text>
                </Pressable>
              </View>
              {commentError ? (
                <Text accessibilityRole="alert" style={styles.commentError}>
                  {commentError}
                </Text>
              ) : null}
            </View>

            {postComments.length === 0 ? (
              <View style={styles.emptyCommentsCard}>
                <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
                <Text style={styles.emptyCommentsBody}>
                  Be the first to share a kind note on {pet.name}&apos;s moment.
                </Text>
              </View>
            ) : (
              <View style={styles.commentList}>
                {postComments.map((comment) => {
                  const commentReaction = commentReactions[comment.id];
                  return (
                    <View key={comment.id} style={styles.commentCard}>
                      <Text selectable style={styles.commentBody}>
                        {comment.body}
                      </Text>
                      <Text style={styles.commentTimestamp}>
                        {formatCommentTimestamp(comment.createdAt)}
                      </Text>
                      <View style={styles.commentReactions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={'Like comment: ' + comment.body}
                          accessibilityState={{ selected: commentReaction === 'like' }}
                          aria-selected={commentReaction === 'like'}
                          onPress={() => reactToComment(comment.id, 'like')}
                          style={[
                            styles.commentReactionButton,
                            commentReaction === 'like' ? styles.likeSelected : null,
                          ]}>
                          <Text style={styles.commentReactionEmoji}>👍</Text>
                          <Text
                            style={[
                              styles.commentReactionText,
                              commentReaction === 'like' ? styles.activeText : null,
                            ]}>
                            Like
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={'Love comment: ' + comment.body}
                          accessibilityState={{ selected: commentReaction === 'love' }}
                          aria-selected={commentReaction === 'love'}
                          onPress={() => reactToComment(comment.id, 'love')}
                          style={[
                            styles.commentReactionButton,
                            commentReaction === 'love' ? styles.loveSelected : null,
                          ]}>
                          <Text style={styles.commentReactionEmoji}>💚</Text>
                          <Text
                            style={[
                              styles.commentReactionText,
                              commentReaction === 'love' ? styles.activeText : null,
                            ]}>
                            Love
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
          {pet.isUserPet ? (
            <View style={styles.deleteSection}>
              {deleteError ? (
                <Text accessibilityRole="alert" style={styles.deleteError}>
                  {deleteError}
                </Text>
              ) : null}
              {confirmingDelete ? (
                <View style={styles.deleteConfirmRow}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isDeleting}
                    onPress={() => {
                      setConfirmingDelete(false);
                      setDeleteError(null);
                    }}
                    style={styles.cancelDeleteButton}>
                    <Text style={styles.cancelDeleteText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={'Confirm delete ' + pet.name + "'s moment"}
                    disabled={isDeleting}
                    onPress={() => void handleDelete()}
                    style={styles.confirmDeleteButton}>
                    <Text style={styles.confirmDeleteText}>
                      {isDeleting ? 'Deleting…' : 'Confirm delete'}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={'Delete ' + pet.name + "'s moment"}
                  onPress={() => {
                    setDeleteError(null);
                    setConfirmingDelete(true);
                  }}
                  style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete moment</Text>
                </Pressable>
              )}
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={styles.backText}>Back to the feed</Text>
          </Pressable>
        </View>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  personalityLabel: {
    color: '#30483a',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  screen: {
    backgroundColor: '#f7f5ef',
    flex: 1,
  },
  content: {
    paddingBottom: 36,
  },
  innerContainer: {
    gap: 15,
    padding: 18,
    width: '100%',
  },
  loading: {
    alignItems: 'center',
    backgroundColor: '#f7f5ef',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#65756b',
    fontSize: 13,
  },
  notFoundTitle: {
    color: '#34473b',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleGroup: {
    gap: 3,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileLink: {
    backgroundColor: '#e5eee3',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  profileLinkText: {
    color: '#355e48',
    fontSize: 11,
    fontWeight: '800',
  },
  petName: {
    color: '#263d32',
    fontSize: 26,
    fontWeight: '900',
  },
  species: {
    color: '#68776e',
    fontSize: 12,
  },
  description: {
    color: '#35483b',
    fontSize: 18,
    lineHeight: 26,
  },
  reactions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 3,
  },
  reaction: {
    alignItems: 'center',
    borderColor: '#dfe5db',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
  },
  likeSelected: {
    backgroundColor: '#e7f1e9',
    borderColor: '#74a887',
  },
  loveSelected: {
    backgroundColor: '#fbe9e6',
    borderColor: '#dc9487',
  },
  reactionEmoji: {
    fontSize: 17,
  },
  reactionText: {
    color: '#506057',
    fontSize: 13,
    fontWeight: '800',
  },
  activeText: {
    color: '#294a38',
  },
  localNote: {
    alignItems: 'center',
    backgroundColor: '#eef1e9',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  localNoteEmoji: {
    fontSize: 14,
  },
  localNoteText: {
    color: '#526459',
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#386c54',
    borderRadius: 17,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  backText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  deleteSection: {
    gap: 8,
  },
  deleteError: {
    color: '#9f3428',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: '#dc9487',
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#9f3428',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelDeleteButton: {
    alignItems: 'center',
    borderColor: '#dfe5db',
    borderRadius: 17,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  cancelDeleteText: {
    color: '#506057',
    fontSize: 13,
    fontWeight: '800',
  },
  confirmDeleteButton: {
    alignItems: 'center',
    backgroundColor: '#9f3428',
    borderRadius: 17,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  confirmDeleteText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  commentsSection: {
    gap: 12,
    paddingTop: 4,
  },
  commentsHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentsHeading: {
    color: '#263d32',
    fontSize: 19,
    fontWeight: '900',
  },
  commentsCount: {
    color: '#68776e',
    fontSize: 12,
    fontWeight: '700',
  },
  composerCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe5db',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  commentInputLabel: {
    color: '#30483a',
    fontSize: 13,
    fontWeight: '800',
  },
  commentInput: {
    backgroundColor: '#f7f5ef',
    borderColor: '#dce3d9',
    borderRadius: 14,
    borderWidth: 1,
    color: '#263d32',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  composerFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  commentCounter: {
    color: '#68776e',
    fontSize: 12,
    fontWeight: '700',
  },
  commentCounterOver: {
    color: '#9f3428',
  },
  postCommentButton: {
    alignItems: 'center',
    backgroundColor: '#386c54',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.62,
  },
  postCommentButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  commentError: {
    color: '#9f3428',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyCommentsCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e8e9df',
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    padding: 18,
  },
  emptyCommentsTitle: {
    color: '#30483a',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyCommentsBody: {
    color: '#68776e',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  commentList: {
    gap: 10,
  },
  commentCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e8e9df',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  commentBody: {
    color: '#263d32',
    fontSize: 15,
    lineHeight: 22,
  },
  commentTimestamp: {
    color: '#68776e',
    fontSize: 11,
    fontWeight: '600',
  },
  commentReactions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
  commentReactionButton: {
    alignItems: 'center',
    borderColor: '#dfe5db',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  commentReactionEmoji: {
    fontSize: 15,
  },
  commentReactionText: {
    color: '#506057',
    fontSize: 12,
    fontWeight: '800',
  },
});
