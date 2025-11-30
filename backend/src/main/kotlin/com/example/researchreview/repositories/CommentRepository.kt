package com.example.researchreview.repositories

import com.example.researchreview.entities.Comment
import org.springframework.data.jpa.repository.JpaRepository

interface CommentRepository: JpaRepository<Comment, String>