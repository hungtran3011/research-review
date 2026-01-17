package com.example.researchreview.entities

import com.example.researchreview.constants.CommentStatus
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.JoinColumn
import jakarta.persistence.Lob
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table

@Entity
@Table(name = "comment_thread")
class CommentThread: BaseEntity() {
    @Enumerated(EnumType.STRING)
    var status: CommentStatus = CommentStatus.OPEN

    @ManyToOne
    @JoinColumn(name = "article_id")
    lateinit var article: Article

    @ManyToOne
    @JoinColumn(name = "reviewer_id")
    var reviewer: Reviewer? = null

    var version: Int = 0
    var x: Int = 0
    var y: Int = 0
    var width: Int? = null
    var height: Int? = null
    var pageNumber: Int = 1

    @Lob
    @Column(name = "selected_text", columnDefinition = "TEXT")
    var selectedText: String? = null

    var section: String? = null

    @OneToMany(mappedBy = "thread", cascade = [CascadeType.ALL], orphanRemoval = true)
    var comments: MutableList<Comment> = mutableListOf()
}