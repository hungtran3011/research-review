package com.example.researchreview.repositories

import com.example.researchreview.entities.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.Optional

interface UserRepository: JpaRepository<User, String> {
    @Query("SELECT u FROM User u WHERE u.deleted = false")
    fun findAllByDeletedFalse(): List<User>

    @Query(value = "SELECT DISTINCT u.* FROM users u " +
            "left join institution i on i.id = u.institution_id " +
            "WHERE u.deleted = false " +
            "and (:emailQuery IS NULL OR to_tsvector('simple', COALESCE(LOWER(u.email), '')) @@ to_tsquery('simple', :emailQuery)) " +
            "and (:nameQuery IS NULL OR to_tsvector('simple', COALESCE(LOWER(u.name), '')) @@ to_tsquery('simple', :nameQuery)) " +
            "and (:institutionQuery IS NULL OR to_tsvector('simple', COALESCE(LOWER(i.name), '')) @@ to_tsquery('simple', :institutionQuery)) " +
            "and (:role IS NULL OR LOWER(u.global_role) = LOWER(:role)) " +
            "and (:status IS NULL OR ( :statusOrdinal IS NOT NULL AND u.status = CAST(:statusOrdinal AS smallint) )) " +
            "limit :#{#pageable.pageSize} offset :#{#pageable.offset}",
        countQuery = "SELECT count(DISTINCT u.id) FROM users u " +
                "left join institution i on i.id = u.institution_id " +
                "WHERE u.deleted = false " +
                "and (:emailQuery IS NULL OR to_tsvector('simple', COALESCE(LOWER(u.email), '')) @@ to_tsquery('simple', :emailQuery)) " +
                "and (:nameQuery IS NULL OR to_tsvector('simple', COALESCE(LOWER(u.name), '')) @@ to_tsquery('simple', :nameQuery)) " +
                "and (:institutionQuery IS NULL OR to_tsvector('simple', COALESCE(LOWER(i.name), '')) @@ to_tsquery('simple', :institutionQuery)) " +
            "and (:role IS NULL OR LOWER(u.global_role) = LOWER(:role)) " +
                "and (:status IS NULL OR ( :statusOrdinal IS NOT NULL AND u.status = CAST(:statusOrdinal AS smallint) ))",
        nativeQuery = true)
    fun search(
        emailQuery: String?,
        nameQuery: String?,
        institutionQuery: String?,
        role: String?,
        status: String?,
        statusOrdinal: Int?,
        pageable: Pageable
    ): Page<User>

    @Query("SELECT u FROM User u WHERE u.email = :#{#email} and u.deleted = false")
    fun findByEmail(email: String): User?

    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email) and u.deleted = false")
    fun findByEmailIgnoreCase(email: String): Optional<User>

    @Query("SELECT u FROM User u WHERE u.deleted = false")
    fun getAll(pageable: Pageable): Page<User>

    fun findByIdAndDeletedFalse(id: String): Optional<User>

    override fun deleteById(id: String) {
        val user = findByIdAndDeletedFalse(id).orElseThrow { Exception("User not found") }
        user.deleted = true
        save(user)
    }

    @Query(
        "SELECT u FROM User u WHERE u.deleted = false"
    )
    override fun findAll(pageable: Pageable): Page<User>
}