package com.example.researchreview.entities

import com.example.researchreview.constants.AccountStatus
import com.example.researchreview.constants.Role
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import lombok.NonNull
import java.util.UUID

@Entity
@Table(name = "users")
class Users: BaseEntity() {

    var name: String = "";
    var email: String = "";
    var role: Role = Role.USER;
    var avatarId: String? = null;

    @ManyToOne
    @JoinColumn(name = "institution_id")
    var institution: Institution? = null;
}