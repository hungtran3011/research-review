# Navigation and Parameter Passing Guide

## Overview
This guide explains different methods to pass parameters between screens in React Router.

---

## Method 1: URL Parameters (Recommended for IDs)

### Best for: Passing article IDs, user IDs, etc.

### Setup Route:
```tsx
// In main.tsx
<Route path='/article/review/:articleId' element={<ReviewArticle />} />
<Route path='/article/initial-review/:articleId' element={<EditorInitialReview />} />
```

### Navigate with params:
```tsx
import { useNavigate } from 'react-router'

function ArticleList() {
  const navigate = useNavigate()
  
  const handleViewArticle = (articleId: string) => {
    navigate(`/article/review/${articleId}`)
  }
  
  return (
    <button onClick={() => handleViewArticle('article-123')}>
      View Article
    </button>
  )
}
```

### Read params in destination:
```tsx
import { useParams } from 'react-router'

function ReviewArticle() {
  const { articleId } = useParams()
  
  // Use articleId to fetch data
  useEffect(() => {
    fetchArticle(articleId)
  }, [articleId])
  
  return <div>Reviewing article: {articleId}</div>
}
```

---

## Method 2: Query Parameters (Recommended for Optional Filters)

### Best for: Filters, sorting, pagination

### Navigate with query params:
```tsx
import { useNavigate } from 'react-router'

function SearchResults() {
  const navigate = useNavigate()
  
  const handleFilter = () => {
    navigate('/articles?status=pending&page=2&sort=date')
  }
  
  return <button onClick={handleFilter}>Apply Filter</button>
}
```

### Read query params:
```tsx
import { useSearchParams } from 'react-router'

function ArticleList() {
  const [searchParams] = useSearchParams()
  
  const status = searchParams.get('status') // 'pending'
  const page = searchParams.get('page')     // '2'
  const sort = searchParams.get('sort')     // 'date'
  
  return <div>Showing {status} articles, page {page}</div>
}
```

---

## Method 3: State (Recommended for Complex Objects)

### Best for: Passing full objects without exposing in URL

### Navigate with state:
```tsx
import { useNavigate } from 'react-router'

function ArticleList() {
  const navigate = useNavigate()
  
  const handleReview = (article: Article) => {
    navigate('/article/review', {
      state: {
        article: article,
        previousPage: 'list',
        timestamp: new Date()
      }
    })
  }
  
  return (
    <button onClick={() => handleReview(articleData)}>
      Review Article
    </button>
  )
}
```

### Read state in destination:
```tsx
import { useLocation } from 'react-router'

interface LocationState {
  article: Article
  previousPage: string
  timestamp: Date
}

function ReviewArticle() {
  const location = useLocation()
  const state = location.state as LocationState
  
  // Access the passed data
  const article = state?.article
  const previousPage = state?.previousPage
  
  if (!article) {
    return <div>No article data provided</div>
  }
  
  return <div>Reviewing: {article.title}</div>
}
```

---

## Method 4: Combination (Best Practice)

### Use URL params for essential data + state for supplementary data

```tsx
// Navigation
function ArticleList() {
  const navigate = useNavigate()
  
  const handleReview = (article: Article) => {
    navigate(`/article/review/${article.id}`, {
      state: {
        title: article.title,      // Quick access without fetching
        authors: article.authors,  // Avoid additional API call
        fromPage: 'dashboard'
      }
    })
  }
  
  return <button onClick={() => handleReview(articleData)}>Review</button>
}

// Destination
function ReviewArticle() {
  const { articleId } = useParams()
  const location = useLocation()
  const state = location.state as { title?: string; authors?: string[] }
  
  // Use state for immediate display, then fetch full data
  const [article, setArticle] = useState(state)
  
  useEffect(() => {
    // Fetch full article data using ID
    fetchArticle(articleId).then(setArticle)
  }, [articleId])
  
  return <div>{article?.title || 'Loading...'}</div>
}
```

---

## Real-World Example: Editor Workflow

### Step 1: Navigate from article list to initial review
```tsx
// ArticleSubmissionsList.tsx
import { useNavigate } from 'react-router'

function ArticleSubmissionsList() {
  const navigate = useNavigate()
  
  const handleReview = (submission: ArticleSubmission) => {
    navigate(`/article/initial-review/${submission.id}`, {
      state: {
        article: submission,
        returnUrl: '/submissions'
      }
    })
  }
  
  return (
    <div>
      {submissions.map(sub => (
        <button key={sub.id} onClick={() => handleReview(sub)}>
          Review {sub.title}
        </button>
      ))}
    </div>
  )
}
```

### Step 2: Accept and navigate to reviewer assignment
```tsx
// EditorInitialReview.tsx
import { useNavigate, useParams, useLocation } from 'react-router'

function EditorInitialReview() {
  const navigate = useNavigate()
  const { articleId } = useParams()
  const location = useLocation()
  const article = location.state?.article
  
  const handleAccept = (reason: string) => {
    // Save decision to backend
    acceptArticle(articleId, reason).then(() => {
      // Navigate to reviewer finder
      navigate(`/article/find-reviewers/${articleId}`, {
        state: {
          article: article,
          acceptanceNote: reason
        }
      })
    })
  }
  
  const handleReject = (reason: string) => {
    rejectArticle(articleId, reason).then(() => {
      // Return to list
      navigate(location.state?.returnUrl || '/submissions')
    })
  }
  
  return (
    <EditorInitialReview
      article={article}
      onAccept={handleAccept}
      onReject={handleReject}
    />
  )
}
```

### Step 3: Assign reviewers and navigate to review page
```tsx
// FindReviewers.tsx
function FindReviewers() {
  const navigate = useNavigate()
  const { articleId } = useParams()
  const location = useLocation()
  
  const handleAssignReviewers = (reviewers: Reviewer[]) => {
    assignReviewers(articleId, reviewers).then(() => {
      // Navigate to review dashboard
      navigate(`/article/review/${articleId}`, {
        state: {
          message: 'Reviewers assigned successfully',
          reviewers: reviewers
        }
      })
    })
  }
  
  return <div>...</div>
}
```

---

## Important Notes

### 1. State is Lost on Refresh
- URL params persist after refresh ✅
- State is lost after refresh ❌
- Always have fallback to fetch data by ID

### 2. URL Params vs State
```tsx
// ✅ Good: Essential data in URL, supplementary in state
navigate(`/article/${id}`, { state: { title: 'Quick Display' } })

// ❌ Bad: All data in state (lost on refresh)
navigate('/article', { state: { id, title, content, authors } })

// ❌ Bad: Complex objects in URL
navigate(`/article?data=${JSON.stringify(article)}`)
```

### 3. Type Safety
```tsx
// Define state interface
interface ArticleReviewState {
  article?: Article
  returnUrl?: string
}

// Use type assertion
const state = location.state as ArticleReviewState
```

### 4. Programmatic vs Link
```tsx
// Using useNavigate (programmatic)
const navigate = useNavigate()
navigate('/path', { state: data })

// Using Link component
import { Link } from 'react-router'
<Link to="/path" state={{ data }}>Go</Link>
```

---

## Summary

| Method | Use Case | Persists on Refresh | SEO Friendly |
|--------|----------|---------------------|--------------|
| URL Params | IDs, slugs | ✅ | ✅ |
| Query Params | Filters, sorting | ✅ | ✅ |
| State | Complex objects | ❌ | ❌ |
| Combination | Best practice | Partial | ✅ |

**Recommendation**: Use URL params for IDs + state for immediate display, with proper fallback to fetch by ID.
