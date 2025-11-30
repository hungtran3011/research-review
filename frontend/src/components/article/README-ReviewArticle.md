# ReviewArticle Component - Complete Documentation

## Overview
The ReviewArticle component is a comprehensive interface for reviewers to comment on research papers with version control support. It features three main sections: Table of Contents, PDF Viewer, and Comments Panel.

## Features

### 1. **Table of Contents (Left Panel - 280px)**
- Automatically extracted from PDF outline/bookmarks
- Hierarchical display with nested sections
- Clickable items to jump to specific pages
- Shows page numbers for each section
- Nested items are indented for clarity

### 2. **PDF Viewer (Center - Flexible)**
- Full-featured PDF viewing using react-pdf
- Zoom controls (50% - 300%)
- Page navigation with SpinButton
- Scroll tracking
- Annotation markers overlay (for future implementation)
- Responsive width adjustment

### 3. **Comments Panel (Right - 400px)**
- **Version Selection Dropdown**: Switch between different paper versions
- **Comments List**: 
  - Grouped by page number
  - Status badges (Open, Resolved, Addressed)
  - Shows selected text (quoted)
  - Timestamp and author information
  - Section mapping from TOC
- **New Comment Form**:
  - Text area for comment content
  - Auto-captures page number
  - Can reference selected text
  - Maps to current section
- **Comment Actions**:
  - Resolve comments
  - Delete comments
  - Click to navigate to comment location

## Data Structure

### Comment Object
```typescript
interface Comment {
    id: string
    version: number              // Which version this comment belongs to
    pageNumber: number           // Page where comment was made
    position?: {                 // Optional position for markers
        x: number               // Percentage from left
        y: number               // Percentage from top
        width?: number
        height?: number
    }
    selectedText?: string        // Text that was highlighted/selected
    content: string              // The actual comment
    author: string               // Author display name
    authorId: string             // Author identifier
    createdAt: Date
    status: 'open' | 'resolved' | 'addressed'
    replies?: Comment[]          // For threaded comments
    section?: string             // Mapped from TOC
}
```

### Article Version Object
```typescript
interface ArticleVersion {
    version: number
    fileUrl: string              // URL to the PDF file
    uploadedAt: Date
    uploadedBy: string
}
```

### TOC Item Object
```typescript
interface TocItem {
    title: string                // Section/Chapter title
    pageNumber: number           // Starting page
    items?: TocItem[]           // Nested subsections
}
```

## Usage Example

```typescript
import ReviewArticle from './components/article/ReviewArticle'
import { sampleVersions, sampleComments } from './components/article/sampleData'

function App() {
    return (
        <ReviewArticle
            articleId="paper-123"
            initialVersions={sampleVersions}
            initialComments={sampleComments}
        />
    )
}
```

## Key Workflows

### 1. Version Management
- Reviewer selects a version from the dropdown
- PDF loads for that version
- Comments are filtered to show only those for the selected version
- Previous version comments remain accessible

### 2. Adding Comments
1. Click "Add Comment" button
2. Comment form appears at bottom of comments panel
3. Type your comment
4. Optional: Select text in PDF before commenting (captured automatically)
5. Click "Post Comment"
6. Comment is saved with:
   - Current page number
   - Current version
   - Current section (from TOC)
   - Selected text (if any)
   - Position (if clicked on specific location)

### 3. Comment Status Flow
- **Open**: Initial state, awaiting author response
- **Addressed**: Author has responded/made changes
- **Resolved**: Reviewer is satisfied with the response

### 4. Navigation
- Click TOC items → Jump to page
- Click comment card → Jump to comment location (future)
- Use page navigator in PDF controls

## Integration Points

### Backend API Endpoints (To Implement)
```typescript
// Get article versions
GET /api/articles/:articleId/versions
Response: ArticleVersion[]

// Get comments for article
GET /api/articles/:articleId/comments
Response: Comment[]

// Add new comment
POST /api/articles/:articleId/comments
Body: Omit<Comment, 'id' | 'createdAt'>
Response: Comment

// Update comment status
PATCH /api/articles/:articleId/comments/:commentId
Body: { status: 'open' | 'resolved' | 'addressed' }
Response: Comment

// Delete comment
DELETE /api/articles/:articleId/comments/:commentId
Response: { success: boolean }
```

### Authentication
The component assumes an auth context provides:
- Current user information (for author field)
- User ID (for authorId field)
- Permissions (who can comment, resolve, etc.)

## Future Enhancements

### 1. Annotation Markers on PDF
- Visual indicators on PDF pages showing comment locations
- Click marker to open related comment
- Hover to preview comment
- Different colors for different status

### 2. Text Selection Comments
- Select text in PDF → Right-click → "Add Comment"
- Highlight selected text in yellow
- Store precise coordinates and dimensions
- Show highlights on PDF

### 3. Threaded Comments
- Reply to existing comments
- Nested comment threads
- Expand/collapse threads

### 4. Comment Filtering
- Filter by status
- Filter by author
- Filter by page range
- Filter by section

### 5. Export Functionality
- Export all comments to PDF
- Export comments to Word document
- Generate review report

### 6. Real-time Collaboration
- WebSocket integration
- See when other reviewers are viewing
- Live comment updates
- Typing indicators

### 7. Drawing Annotations
- Free-hand drawing on PDF
- Shapes (circle, rectangle, arrow)
- Stamps (Approved, Rejected, etc.)

## Styling Customization

The component uses Fluent UI tokens for theming. Key style classes:
- `tocSection` - Left TOC panel
- `viewerSection` - Center PDF viewer
- `commentsSection` - Right comments panel
- `commentCard` - Individual comment cards
- `annotationMarker` - Annotation markers (future)

## Performance Considerations

1. **TOC Parsing**: Async operation, may take time for large documents
2. **Comment Filtering**: Filtered in-memory, consider pagination for 100+ comments
3. **PDF Rendering**: react-pdf handles lazy loading
4. **Position Calculations**: Cached in refs to avoid recalculation

## Testing Data

Sample data is provided in `sampleData.ts`:
- 3 versions of a paper
- 5 comments across different versions
- Mix of open, resolved, and addressed statuses
- Comments with and without selected text

## Component Files

- `ReviewArticle.tsx` - Main component (545 lines)
- `PdfViewer.tsx` - Enhanced with `onDocumentLoadSuccess` callback
- `sampleData.ts` - Sample data for testing
- This README for documentation

## Dependencies

- `@fluentui/react-components` - UI components
- `@fluentui/react-icons` - Icons
- `react-pdf` - PDF rendering
- `pdfjs-dist` - PDF.js library (via unpkg CDN)

## Notes

- Comments are stored separately from PDF (PDF is read-only in browser)
- Position coordinates use percentages for responsiveness
- TOC extraction depends on PDF having bookmarks/outline
- Version management allows tracking changes over time
- Each version maintains its own comment thread
