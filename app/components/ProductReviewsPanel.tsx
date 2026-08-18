'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AUTH_TOKEN_KEY, hasStoredAuth } from '@/lib/constants/auth';
import {
  createReview,
  deleteReview,
  getMyReviews,
  getProductReviews,
  type Review,
  updateReview,
} from '@/lib/services/reviewService';

const starLabel = (value: number) => '★'.repeat(value) + '☆'.repeat(5 - value);

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const getErrorMessage = (message: string) => {
  if (message.includes('at least 12 characters') || message.includes('at least 12')) {
    return 'Review text can be 1 character or more.';
  }
  if (message.includes('not purchased')) return 'You can only review products you have purchased.';
  if (message.includes('delivered')) return 'You can review this product after your order is delivered.';
  if (message.includes('already reviewed')) return 'You have already reviewed this product.';
  if (message.includes('log in')) return 'Please log in to submit a review.';
  if (message.includes('401') || message.includes('Unauthorized')) return 'Please log in to submit a review.';
  return message || 'Something went wrong. Please try again.';
};

const isLoggedIn = () => hasStoredAuth();

export default function ProductReviewsPanel({
  productId,
  productName,
  productImage,
}: {
  productId: string;
  productName: string;
  productImage?: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState(0);
  const [comment, setComment] = useState('');
  const [pendingOrderItem, setPendingOrderItem] = useState<{ product_id?: string; order_id?: string } | null>(null);
  const [myReviewsLoading, setMyReviewsLoading] = useState(false);
  const [purchasedProductIds, setPurchasedProductIds] = useState<Set<string> | null>(null);
  const searchParams = useSearchParams();

  const productMyReviews = useMemo(
    () => myReviews.filter((item) => String(item.product_id || item.productId || '') === String(productId)),
    [myReviews, productId]
  );

  const currentUserReview = useMemo(
    () => productMyReviews[0] || null,
    [productMyReviews]
  );

  const purchaseCheckLoaded = purchasedProductIds !== null;

  const hasPurchasedCurrentProduct = useMemo(
    () => Boolean(purchasedProductIds && purchasedProductIds.has(String(productId))),
    [purchasedProductIds, productId]
  );

  const loadReviews = async () => {
    setLoading(true);
    setReviewError('');

    try {
      const data = await getProductReviews(productId);
      setReviews(data.reviews);
      const reviewList = isLoggedIn() ? await getMyReviews() : [];
      setMyReviews(reviewList);
    } catch (error) {
      setReviewError(getErrorMessage(error instanceof Error ? error.message : 'Unable to load product reviews.'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, [productId]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setMyReviews([]);
      setPurchasedProductIds(null);
      return;
    }

    const loadMyReviews = async () => {
      setMyReviewsLoading(true);
      try {
        const list = await getMyReviews();
        setMyReviews(list);
      } catch {
        setMyReviews([]);
      } finally {
        setMyReviewsLoading(false);
      }
    };

    const loadPurchasedProducts = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) || '' : '';
        const response = await fetch('/api/orders/user/history', {
          method: 'GET',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to load purchased products.');
        }

        const payload = (await response.json()) as Array<{
          status?: string;
          items?: Array<{ product_id?: string | null }>;
        }>;

        const nextPurchased = new Set<string>();
        for (const order of payload || []) {
          if (!order || typeof order !== 'object') continue;
          const status = String(order.status || '').toLowerCase();
          if (status !== 'delivered' && status !== 'completed') continue;

          for (const item of order.items || []) {
            const productIdValue = String(item?.product_id || '').trim();
            if (productIdValue) {
              nextPurchased.add(productIdValue);
            }
          }
        }

        setPurchasedProductIds(nextPurchased);
      } catch {
        setPurchasedProductIds(new Set());
      }
    };

    setPurchasedProductIds(null);
    void loadMyReviews();
    void loadPurchasedProducts();
  }, [productId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1));
  }, [reviews]);

  const totalReviews = reviews.length;
  const breakdown = useMemo(() => {
    const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((item) => {
      const key = Math.max(1, Math.min(5, item.rating));
      result[key as keyof typeof result] += 1;
    });
    return result;
  }, [reviews]);

  const maxBreakdown = Math.max(...Object.values(breakdown), 1);

  const resetForm = () => {
    setSelectedStars(0);
    setComment('');
    setReviewFormOpen(false);
    setEditingReviewId(null);
    setPendingOrderItem(null);
  };

  const handleSubmit = async () => {
    const trimmedComment = comment.trim();

    if (!selectedStars) {
      setReviewError('Please select a rating before submitting.');
      return;
    }

    if (!trimmedComment || trimmedComment.length < 1) {
      setReviewError('Please write a review before submitting.');
      return;
    }

    setSubmitting(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, { rating: selectedStars, comment: trimmedComment });
        setReviewSuccess('Your review has been updated.');
      } else {
        if (!pendingOrderItem?.product_id || !pendingOrderItem.order_id) {
          throw new Error('You can only review products you have purchased.');
        }
        await createReview({
          product_id: pendingOrderItem.product_id,
          order_id: pendingOrderItem.order_id,
          rating: selectedStars,
          comment: trimmedComment,
        });
        setReviewSuccess('Your review has been submitted successfully.');
      }
      resetForm();
      await loadReviews();
    } catch (error) {
      setReviewError(getErrorMessage(error instanceof Error ? error.message : 'Unable to submit review.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReviewId(String(review.id || review.review_id || ''));
    setSelectedStars(review.rating);
    setComment(review.comment || review.review || '');
    setReviewFormOpen(true);
    setReviewError('');
    setReviewSuccess('');
  };

  const handleDelete = async (review: Review) => {
    const reviewId = String(review.id || review.review_id || '');
    if (!reviewId || !window.confirm('Delete Review?\n\nAre you sure you want to delete this review?')) {
      return;
    }

    setDeletingId(reviewId);
    setReviewError('');
    setReviewSuccess('');

    try {
      await deleteReview(reviewId);
      setReviewSuccess('Your review was deleted.');
      resetForm();
      await loadReviews();
    } catch (error) {
      setReviewError(getErrorMessage(error instanceof Error ? error.message : 'Unable to delete review.'));
    } finally {
      setDeletingId(null);
    }
  };

  const canWriteReview = !loading && isLoggedIn() && purchaseCheckLoaded && hasPurchasedCurrentProduct && !currentUserReview;

  useEffect(() => {
    if (searchParams.get('openReview') !== '1' || !isLoggedIn() || currentUserReview || loading) {
      return;
    }

    if (!purchaseCheckLoaded) {
      return;
    }

    if (!hasPurchasedCurrentProduct) {
      setReviewFormOpen(false);
      setPendingOrderItem(null);
      setReviewError('');
      return;
    }

    const orderId = searchParams.get('orderId') || '';
    setReviewFormOpen(true);
    setPendingOrderItem({ product_id: productId, order_id: orderId });
    setSelectedStars(0);
    setComment('');
    setReviewError('');
    setReviewSuccess('');
  }, [searchParams, currentUserReview, loading, hasPurchasedCurrentProduct, purchaseCheckLoaded, productId]);

  return (
    <section className="product-review-section" aria-label="Customer reviews">
      <div className="product-review-header">
        <div>
          <h2>Customer Reviews</h2>
          {!loading && totalReviews > 0 ? (
            <div className="product-review-summary">
              <span className="product-review-stars">{starLabel(Math.round(averageRating))}</span>
              <strong>{averageRating.toFixed(1)}/5</strong>
              <span>Based on {totalReviews} reviews</span>
            </div>
          ) : null}
        </div>
        {canWriteReview ? (
          <button type="button" className="checkout-link-button" onClick={() => {
            setReviewFormOpen(true);
            setEditingReviewId(null);
            setSelectedStars(0);
            setComment('');
            setPendingOrderItem({ product_id: productId, order_id: '' });
          }}>
            Write a Review
          </button>
        ) : null}
      </div>

      {!loading && totalReviews > 0 ? (
        <div className="product-review-breakdown" aria-label="Rating breakdown">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star as keyof typeof breakdown] || 0;
            const percentage = totalReviews ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="product-review-breakdown-row">
                <span>{star}★</span>
                <div className="product-review-breakdown-bar"><div className="product-review-breakdown-fill" style={{ width: `${(count / maxBreakdown) * 100}%` }} /></div>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {reviewError ? <p className="checkout-message error">{reviewError}</p> : null}
      {reviewSuccess ? <p className="checkout-message success">{reviewSuccess}</p> : null}

      {!loading && isLoggedIn() && !currentUserReview && reviewFormOpen ? (
        <div className="product-review-panel">
          <h3>{editingReviewId ? 'Edit Your Review' : 'Write a Review'}</h3>
          <div className="product-review-form">
            <div>
              <label className="checkout-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Your rating</label>
              <div className="review-star-selector" aria-label="Select rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`review-star-button ${selectedStars >= star ? 'active' : ''}`}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    onClick={() => setSelectedStars(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="checkout-muted" htmlFor="review-comment" style={{ display: 'block', marginBottom: '0.5rem' }}>Your review</label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Write your review..."
                maxLength={1000}
              />
            </div>

            <div className="product-review-item-actions">
              <button type="button" className="checkout-primary-button" onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
              </button>
              <button type="button" className="checkout-link-button" onClick={resetForm} disabled={submitting}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="product-review-layout">
        <div className="product-review-panel">
          {loading ? (
            <p className="product-review-message">Loading reviews…</p>
          ) : totalReviews === 0 ? (
            <p className="product-review-empty">No reviews yet for this product.</p>
          ) : (
            <div className="product-review-list">
              {reviews.map((review) => (
                <article key={String(review.id || review.review_id || `${review.product_id}-${review.created_at}`)} className="review-item">
                  <div className="review-item-header">
                    <strong>{review.customer_name || review.name || 'Customer'}</strong>
                    <span className="review-item-meta">{formatDate(review.created_at || review.updated_at)}</span>
                  </div>
                  <div className="product-review-inline-stars">{starLabel(review.rating)}</div>
                  <p>{review.comment || review.review || 'No comment provided.'}</p>
                  {String(review.customer_name || review.name || '') === 'Customer' || !review.customer_name ? null : null}
                </article>
              ))}
            </div>
          )}
        </div>

        {isLoggedIn() && !loading && productMyReviews.length > 0 ? (
          <div className="product-review-panel">
            <h3>My Reviews</h3>
            {myReviewsLoading ? <p className="product-review-message">Loading your reviews…</p> : null}
            {!myReviewsLoading && productMyReviews.length > 0 ? (
              <div className="profile-my-reviews">
                {productMyReviews.map((review) => (
                  <article key={String(review.id || review.review_id || `${review.product_id}-${review.created_at}`)} className="profile-review-card">
                    <div className="profile-review-card-header">
                      <div className="profile-review-card-top">
                        <img src={review.image_url || productImage || '/images/banner_main.jpeg'} alt={review.product_name || review.productName || productName} className="profile-review-thumb" />
                        <div>
                          <strong>{review.product_name || review.productName || productName}</strong>
                          <div className="product-review-inline-stars">{starLabel(review.rating)}</div>
                        </div>
                      </div>
                      <span className="review-item-meta">{formatDate(review.created_at || review.updated_at)}</span>
                    </div>
                    <p>{review.comment || review.review || 'No comment provided.'}</p>
                    <div className="profile-review-actions">
                      <Link href={`/products/${encodeURIComponent(String(review.product_id || review.productId || productId))}`} className="checkout-link-button">View Product</Link>
                      {/* <button type="button" className="checkout-link-button" onClick={() => handleEdit(review)}>Edit</button>
                      <button type="button" className="checkout-link-button" onClick={() => void handleDelete(review)} disabled={deletingId === String(review.id || review.review_id || '')}>
                        {deletingId === String(review.id || review.review_id || '') ? 'Deleting...' : 'Delete'}
                      </button> */}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
