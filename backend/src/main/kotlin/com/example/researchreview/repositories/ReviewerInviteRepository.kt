package com.example.researchreview.repositories

import com.example.researchreview.entities.ReviewerInvite
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.stereotype.Repository

@Repository
interface ReviewerInviteRepository : JpaRepository<ReviewerInvite, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    fun findByTokenHash(tokenHash: String): ReviewerInvite?
}
