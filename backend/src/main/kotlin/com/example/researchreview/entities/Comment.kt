package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.Lob
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "comment")
class Comment: BaseEntity() {
    @Lob
    var content: String = "";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thread_id")
    var thread: CommentThread = CommentThread();

    var authorName: String = "";
    var authorId: String = "";
}