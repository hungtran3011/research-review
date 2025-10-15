package com.example.researchreview.entities

import com.example.researchreview.constants.Role
import jakarta.persistence.Entity
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "users")
class User: BaseEntity() {

    var name: String = "";
    var email: String = "";
    var role: Role = Role.USER;
    var avatarId: String? = null;

    @ManyToOne
    @JoinColumn(name = "institution_id")
    var institution: Institution? = null;
}