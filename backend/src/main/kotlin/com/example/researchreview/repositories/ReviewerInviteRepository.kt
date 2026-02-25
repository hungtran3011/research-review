package com.example.researchreview.repositories

import com.example.researchreview.entities.ReviewerInvite
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface ReviewerInviteRepository : JpaRepository<ReviewerInvite, String> {

    fun findByTokenHash(tokenHash: String): ReviewerInvite?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ri FROM ReviewerInvite ri WHERE ri.tokenHash = :tokenHash")
    fun findByTokenHashForUpdate(@Param("tokenHash") tokenHash: String): ReviewerInvite?
}
