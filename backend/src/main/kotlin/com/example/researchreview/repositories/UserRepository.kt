package com.example.researchreview.repositories

import com.example.researchreview.dtos.UserSearchRequestDto
import com.example.researchreview.entities.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.Optional

interface UserRepository: JpaRepository<User, String> {
    @Query(value = "SELECT DISTINCT u.* FROM users u " +
            "left join institution i on i.id = u.institution_id " +
            "left join user_roles ur on ur.user_id = u.id " +
            "WHERE u.deleted = false " +
            "and (:emailPattern IS NULL OR LOWER(u.email) LIKE :emailPattern) " +
            "and (:namePattern IS NULL OR LOWER(u.name) LIKE :namePattern) " +
            "and (:institutionPattern IS NULL OR LOWER(i.name) LIKE :institutionPattern) " +
            "and (:role IS NULL OR ( ( :roleOrdinal IS NOT NULL AND u.role = CAST(:roleOrdinal AS smallint) ) OR (ur.roles = :role) )) " +
            "and (:status IS NULL OR ( :statusOrdinal IS NOT NULL AND u.status = CAST(:statusOrdinal AS smallint) )) " +
            "limit :#{#pageable.pageSize} offset :#{#pageable.offset}",
        countQuery = "SELECT count(DISTINCT u.id) FROM users u " +
                "left join institution i on i.id = u.institution_id " +
                "left join user_roles ur on ur.user_id = u.id " +
                "WHERE u.deleted = false " +
                "and (:emailPattern IS NULL OR LOWER(u.email) LIKE :emailPattern) " +
                "and (:namePattern IS NULL OR LOWER(u.name) LIKE :namePattern) " +
                "and (:institutionPattern IS NULL OR LOWER(i.name) LIKE :institutionPattern) " +
                "and (:role IS NULL OR ( ( :roleOrdinal IS NOT NULL AND u.role = CAST(:roleOrdinal AS smallint) ) OR (ur.roles = :role) )) " +
                "and (:status IS NULL OR ( :statusOrdinal IS NOT NULL AND u.status = CAST(:statusOrdinal AS smallint) ))",
        nativeQuery = true)
    fun search(
        emailPattern: String?,
        namePattern: String?,
        institutionPattern: String?,
        role: String?,
        roleOrdinal: Int?,
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