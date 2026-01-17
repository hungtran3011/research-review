package com.example.researchreview.entities

import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Column
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "comment")
class Comment: BaseEntity() {
    @Column(columnDefinition = "TEXT")
    var content: String = ""

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thread_id")
    lateinit var thread: CommentThread

    var authorName: String = ""
    var authorId: String = ""
}