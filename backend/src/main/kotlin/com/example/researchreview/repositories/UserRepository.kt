package com.example.researchreview.repositories

import com.example.researchreview.dtos.UserRequestDto
import com.example.researchreview.entities.User
import org.hibernate.annotations.DialectOverride
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.Optional

interface UserRepository: JpaRepository<User, String> {
    @Query(value = "SELECT * FROM users u " +
            "left join institution i on i.id = u.institution_id " +
            "WHERE u.deleted = false " +
            "and to_tsvector(u.email) @@ to_tsquery(:#{#dto.email}) " +
            "and to_tsvector(u.name) @@ to_tsquery(:#{#dto.name}) " +
            "and to_tsvector(i.name) @@ to_tsquery(:#{#dto.institutionName}) " +
            "and to_tsvector(u.role) @@ to_tsquery(:#{#dto.role}) " +
            "limit :#{#pageable.pageSize} offset :#{#pageable.offset}",
        countQuery = "SELECT count(*) FROM users u " +
                "left join institution i on i.id = u.institution_id " +
                "WHERE u.deleted = false " +
                "and to_tsvector(u.email) @@ to_tsquery(:#{#dto.email}) " +
                "and to_tsvector(u.name) @@ to_tsquery(:#{#dto.name}) " +
                "and to_tsvector(i.name) @@ to_tsquery(:#{#dto.institutionName}) " +
                "and to_tsvector(u.role) @@ to_tsquery(:#{#dto.role}) " +
                "limit :#{#pageable.pageSize} offset :#{#pageable.offset}",
        nativeQuery = true)
    fun search(dto: UserRequestDto, pageable: Pageable): Page<User>

    @Query("SELECT u FROM User u WHERE u.email = :#{#email} and u.deleted = false")
    fun findByEmail(email: String): User?

    @Query("SELECT u FROM User u WHERE u.deleted = false")
    fun getAll(pageable: Pageable): Page<User>

    fun findByIdAndDeletedFalse(id: String): Optional<User>

    override fun deleteById(id: String) {
        val user = findByIdAndDeletedFalse(id).orElseThrow { Exception("User not found") }
        user.deleted = true
        save(user)
    }
}