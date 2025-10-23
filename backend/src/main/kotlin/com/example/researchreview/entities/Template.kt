package com.example.researchreview.entities

import jakarta.persistence.*

@Entity
@Table(name = "templates")
class Template(
    var name: String = "",
    var description: String? = "",
    var bucketPath: String? = null,
    @Column(columnDefinition = "TEXT")
    var variables: String? = null, // JSON array of variable names like ["userName", "userEmail", "resetLink"]
): BaseEntity() {
}
