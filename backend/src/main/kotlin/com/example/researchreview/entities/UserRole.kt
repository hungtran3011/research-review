package com.example.researchreview.entities

import com.example.researchreview.constants.Role
import jakarta.persistence.*
import org.hibernate.envers.Audited

@Entity
@Audited
@Table(
    name = "user_roles",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "roles"]) ]
)
class UserRole: BaseEntity() {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    lateinit var user: User

    @Enumerated(EnumType.STRING)
    @Column(name = "roles", nullable = false)
    var role: Role = Role.USER
}
