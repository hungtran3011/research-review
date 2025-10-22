package com.example.researchreview.entities

import jakarta.persistence.*
import lombok.AllArgsConstructor

@Entity
@Table(name = "templates")
@AllArgsConstructor
class Template(
    var name: String,
    var description: String? = "",
    var bucketPath: String,
): BaseEntity() {

}
