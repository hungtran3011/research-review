package com.example.researchreview.entities

import com.example.researchreview.constants.CommentStatus
import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "comment_thread")
class CommentThread: BaseEntity() {
    var status: CommentStatus = CommentStatus.OPEN;

    @ManyToOne
    var article: Article = Article();

    @ManyToOne
    var reviewer: Reviewer = Reviewer();

    var version: Int = 0;
    var x: Int = 0;
    var y: Int = 0;
}